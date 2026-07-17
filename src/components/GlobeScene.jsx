import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, useTexture } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  Color,
  FrontSide,
  MathUtils,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from "three";

const EARTH_RADIUS = 2.2;
const MARKER_RADIUS = EARTH_RADIUS + 0.025;
const MAX_SUBTLE_MARKERS = 60;
const WORLD_UP = new Vector3(0, 1, 0);
const SUN_POSITION = new Vector3(3, 4, -0.5);
const SUN_DIRECTION = SUN_POSITION.clone().normalize();
const ZOOM_DISTANCES = {
  country: 7.3,
  province: 4.9,
  county: 3.8,
};

// Imagery credits and original download URLs live beside the textures in
// public/textures/SOURCES.md. The day/night/elevation assets are NASA imagery.
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uTwilightColor;
  uniform vec3 uSunDirection;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vWorldNormal;
  varying vec3 vViewDirection;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    float facing = clamp(dot(normal, normalize(vViewDirection)), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, uPower);
    float sunAmount = dot(normal, normalize(uSunDirection)) * 0.5 + 0.5;
    vec3 scatterColor = mix(uTwilightColor, uColor, smoothstep(0.18, 0.82, sunAmount));
    float alpha = smoothstep(0.02, 0.98, fresnel) * uIntensity;
    gl_FragColor = vec4(scatterColor, alpha);
  }
`;

const nightVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nightFragmentShader = /* glsl */ `
  uniform sampler2D uNightMap;
  uniform vec3 uSunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    vec3 source = texture2D(uNightMap, vUv).rgb;
    float luminance = dot(source, vec3(0.2126, 0.7152, 0.0722));
    float cityLight = pow(smoothstep(0.095, 0.54, luminance), 1.12);
    float daylight = dot(normalize(vWorldNormal), normalize(uSunDirection));
    float nightSide = 1.0 - smoothstep(-0.26, 0.38, daylight);
    float visibility = mix(0.42, 1.0, nightSide);
    vec3 coolCore = vec3(0.42, 0.76, 1.0);
    vec3 warmHalo = vec3(1.0, 0.59, 0.22);
    vec3 lightColor = mix(coolCore, warmHalo, smoothstep(0.36, 0.92, luminance));
    gl_FragColor = vec4(lightColor * cityLight * visibility, cityLight * visibility * 0.92);
  }
`;

function cityKey(city) {
  if (!city) return "";
  return String(city.id ?? `${city.name}-${city.lat}-${city.lng}`);
}

function isUsableCity(city) {
  return (
    city &&
    Number.isFinite(Number(city.lat)) &&
    Number.isFinite(Number(city.lng))
  );
}

/**
 * Maps geographic coordinates to the orientation used by Three's sphere UVs.
 * The same mapping is used for camera flight, markers, and surface picking.
 */
function geoToVector(lat, lng, radius = 1) {
  const latitude = MathUtils.degToRad(Number(lat));
  const longitude = MathUtils.degToRad(Number(lng));
  const latitudeRadius = Math.cos(latitude) * radius;

  return new Vector3(
    latitudeRadius * Math.cos(longitude),
    Math.sin(latitude) * radius,
    -latitudeRadius * Math.sin(longitude),
  );
}

function markerScale(city) {
  const population = Math.max(1, Number(city?.population) || 1);
  return MathUtils.clamp(0.74 + Math.log10(population) * 0.095, 0.78, 1.5);
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  return reducedMotion;
}

function CameraFlight({
  focusCity,
  primaryCity,
  comparisonCity,
  zoomLevel,
  controlsRef,
  flightRef,
}) {
  const { camera } = useThree();
  const destination = useRef(new Vector3(0, 0, ZOOM_DISTANCES.country));
  const previousFocus = useRef("");
  const previousZoom = useRef(zoomLevel);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const nextDistance = ZOOM_DISTANCES[zoomLevel] ?? ZOOM_DISTANCES.country;
    const framesPair =
      zoomLevel === "country" &&
      isUsableCity(primaryCity) &&
      isUsableCity(comparisonCity);
    const nextFocus = framesPair
      ? `pair:${cityKey(primaryCity)}:${cityKey(comparisonCity)}`
      : isUsableCity(focusCity)
        ? cityKey(focusCity)
        : "";
    const focusChanged = nextFocus !== previousFocus.current;
    const zoomChanged = zoomLevel !== previousZoom.current;

    if (!focusChanged && !zoomChanged) return;

    let direction;

    if (framesPair) {
      direction = geoToVector(primaryCity.lat, primaryCity.lng).add(
        geoToVector(comparisonCity.lat, comparisonCity.lng),
      );

      // A pure great-circle midpoint between London and Guangzhou sits too far
      // north. A restrained latitude bias preserves both points while matching
      // the selected concept's Europe–Asia–North Africa composition.
      if (direction.lengthSq() > 0.02) direction.y *= 0.58;
    } else {
      direction = isUsableCity(focusCity)
        ? geoToVector(focusCity.lat, focusCity.lng)
        : camera.position.clone().normalize();
    }

    if (direction.lengthSq() < 0.001) direction.set(0, 0, 1);
    destination.current.copy(direction.normalize().multiplyScalar(nextDistance));
    previousFocus.current = nextFocus;
    previousZoom.current = zoomLevel;
    flightRef.current = true;
  }, [
    camera,
    comparisonCity,
    flightRef,
    focusCity,
    primaryCity,
    zoomLevel,
  ]);

  useFrame((_, delta) => {
    if (!flightRef.current) return;

    const destinationDistance = destination.current.length();
    const positionDistance = camera.position.length();
    const directionTarget = destination.current.clone().normalize();
    const directionCurrent = camera.position.clone().normalize();
    const damping = reducedMotion ? 11 : 4.2;
    const blend = 1 - Math.exp(-damping * Math.min(delta, 0.05));

    directionCurrent.lerp(directionTarget, blend).normalize();
    const nextDistance = MathUtils.lerp(positionDistance, destinationDistance, blend);
    camera.position.copy(directionCurrent.multiplyScalar(nextDistance));
    camera.lookAt(0, 0, 0);
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();

    if (camera.position.distanceToSquared(destination.current) < 0.00035) {
      camera.position.copy(destination.current);
      camera.lookAt(0, 0, 0);
      controlsRef.current?.update();
      flightRef.current = false;
    }
  });

  return null;
}

function SceneControls({ controlsRef, flightRef }) {
  const reducedMotion = useReducedMotion();
  const lastInteraction = useRef(Date.now());
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setAutoRotate(false);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setAutoRotate(
        !flightRef.current && Date.now() - lastInteraction.current > 4200,
      );
    }, 500);

    return () => window.clearInterval(timer);
  }, [flightRef, reducedMotion]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.055}
      enablePan={false}
      enableRotate
      enableZoom
      minDistance={3.55}
      maxDistance={10}
      minPolarAngle={0.08}
      maxPolarAngle={Math.PI - 0.08}
      rotateSpeed={0.56}
      zoomSpeed={0.72}
      autoRotate={autoRotate}
      autoRotateSpeed={0.24}
      onStart={() => {
        flightRef.current = false;
        setAutoRotate(false);
      }}
      onEnd={() => {
        lastInteraction.current = Date.now();
      }}
    />
  );
}

function Earth({ cities, onSelectCity }) {
  const [earthMap, bumpMap, specularMap, lightsMap, cloudMap] = useTexture([
    "/textures/earth_day_8192.jpg",
    "/textures/earth_topography_5400.jpg",
    "/textures/earth_specular_2048.jpg",
    "/textures/earth_night_8192.jpg",
    "/textures/earth_clouds_2048.jpg",
  ]);
  const { gl } = useThree();
  const cloudRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    earthMap.colorSpace = SRGBColorSpace;
    lightsMap.colorSpace = SRGBColorSpace;
    [earthMap, bumpMap, specularMap, lightsMap, cloudMap].forEach((texture) => {
      texture.anisotropy = anisotropy;
      texture.needsUpdate = true;
    });
  }, [bumpMap, cloudMap, earthMap, gl, lightsMap, specularMap]);

  useFrame((_, delta) => {
    if (!reducedMotion && cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.0028;
    }
  });

  function selectNearestCity(event) {
    event.stopPropagation();
    if (!cities.length || typeof onSelectCity !== "function") return;

    const clickedDirection = event.point.clone().normalize();
    let nearestCity = null;
    let nearestDistance = Infinity;

    cities.forEach((city) => {
      if (!isUsableCity(city)) return;
      const distance = 1 - clickedDirection.dot(
        geoToVector(city.lat, city.lng).normalize(),
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestCity = city;
      }
    });

    if (nearestCity) onSelectCity(nearestCity);
  }

  return (
    <group>
      <mesh onClick={selectNearestCity}>
        <sphereGeometry args={[EARTH_RADIUS, 144, 112]} />
        <meshPhongMaterial
          map={earthMap}
          bumpMap={bumpMap}
          bumpScale={0.036}
          specularMap={specularMap}
          color="#c2bcad"
          specular="#b3d6e9"
          shininess={34}
        />
      </mesh>

      <mesh raycast={() => null}>
        <sphereGeometry args={[EARTH_RADIUS + 0.006, 144, 112]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
          uniforms={{
            uNightMap: { value: lightsMap },
            uSunDirection: { value: SUN_DIRECTION },
          }}
          vertexShader={nightVertexShader}
          fragmentShader={nightFragmentShader}
        />
      </mesh>

      <mesh ref={cloudRef} raycast={() => null} scale={1.008}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 96]} />
        <meshPhongMaterial
          alphaMap={cloudMap}
          color="#d8edf4"
          transparent
          opacity={0.14}
          depthWrite={false}
          shininess={8}
        />
      </mesh>

      <mesh raycast={() => null} scale={1.004}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 96]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={FrontSide}
          blending={AdditiveBlending}
          toneMapped={false}
          uniforms={{
            uColor: { value: new Color("#82dcff") },
            uTwilightColor: { value: new Color("#1b6ca0") },
            uSunDirection: { value: SUN_DIRECTION },
            uIntensity: { value: 0.44 },
            uPower: { value: 2.7 },
          }}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
        />
      </mesh>

      <mesh raycast={() => null} scale={1.022}>
        <sphereGeometry args={[EARTH_RADIUS, 128, 96]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
          toneMapped={false}
          uniforms={{
            uColor: { value: new Color("#8adfff") },
            uTwilightColor: { value: new Color("#134a7b") },
            uSunDirection: { value: SUN_DIRECTION },
            uIntensity: { value: 0.52 },
            uPower: { value: 2.35 },
          }}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
        />
      </mesh>

      <mesh raycast={() => null} scale={1.058}>
        <sphereGeometry args={[EARTH_RADIUS, 112, 80]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
          toneMapped={false}
          uniforms={{
            uColor: { value: new Color("#258bc2") },
            uTwilightColor: { value: new Color("#0a2b4e") },
            uSunDirection: { value: SUN_DIRECTION },
            uIntensity: { value: 0.08 },
            uPower: { value: 2.0 },
          }}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
        />
      </mesh>
    </group>
  );
}

function SubtleCityMarkers({ cities, onSelectCity }) {
  const meshRef = useRef(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;

    cities.forEach((city, index) => {
      const position = geoToVector(city.lat, city.lng, MARKER_RADIUS);
      const scale = markerScale(city);
      dummy.position.copy(position);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [cities, dummy]);

  if (!cities.length) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, cities.length]}
      onClick={(event) => {
        event.stopPropagation();
        const city = cities[event.instanceId];
        if (city && typeof onSelectCity === "function") onSelectCity(city);
      }}
    >
      <sphereGeometry args={[0.011, 7, 7]} />
      <meshBasicMaterial
        color="#79afc5"
        transparent
        opacity={0.2}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

function SelectedCityMarker({ city, role, onSelectCity, offset = 0 }) {
  const groupRef = useRef(null);
  const markerRef = useRef(null);
  const haloRef = useRef(null);
  const normal = useMemo(
    () => geoToVector(city.lat, city.lng).normalize(),
    [city.lat, city.lng],
  );
  const position = useMemo(
    () => normal.clone().multiplyScalar(MARKER_RADIUS + offset),
    [normal, offset],
  );
  const quaternion = useMemo(
    () => new Object3D().quaternion.setFromUnitVectors(WORLD_UP, normal),
    [normal],
  );
  const color = role === "primary" ? "#f2bd62" : "#67d7ff";
  const scale = role === "primary" ? 1 : 0.86;

  useFrame(({ camera, clock }) => {
    if (groupRef.current) {
      const cameraScale = MathUtils.clamp(
        camera.position.distanceTo(position) / 4.4,
        0.28,
        1.08,
      );
      groupRef.current.scale.setScalar(scale * cameraScale);
    }
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.15 + (role === "primary" ? 0 : 1.6)) * 0.13;
    if (haloRef.current) haloRef.current.scale.setScalar(pulse);
    if (markerRef.current) {
      markerRef.current.position.y = 0.075 + Math.sin(clock.elapsedTime * 1.75) * 0.008;
    }
  });

  return (
    <group ref={groupRef} position={position} quaternion={quaternion} scale={scale}>
      <mesh
        ref={haloRef}
        rotation-x={Math.PI / 2}
        onClick={(event) => {
          event.stopPropagation();
          onSelectCity?.(city);
        }}
      >
        <torusGeometry args={[0.085, 0.008, 6, 36]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.62}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <mesh
        ref={markerRef}
        onClick={(event) => {
          event.stopPropagation();
          onSelectCity?.(city);
        }}
      >
        <sphereGeometry args={[0.052, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.1}
          roughness={0.34}
          metalness={0.1}
        />
      </mesh>
      <mesh position-y={0.036}>
        <cylinderGeometry args={[0.009, 0.02, 0.075, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.82} />
      </mesh>
    </group>
  );
}

function CityMarkers({ cities, primaryCity, comparisonCity, onSelectCity }) {
  const primaryKey = cityKey(primaryCity);
  const comparisonKey = cityKey(comparisonCity);
  const subtleCities = useMemo(
    () =>
      cities
        .filter(
          (city) =>
            isUsableCity(city) &&
            cityKey(city) !== primaryKey &&
            cityKey(city) !== comparisonKey,
        )
        .slice(0, MAX_SUBTLE_MARKERS),
    [cities, comparisonKey, primaryKey],
  );

  return (
    <group>
      <SubtleCityMarkers cities={subtleCities} onSelectCity={onSelectCity} />
      {isUsableCity(primaryCity) && (
        <SelectedCityMarker
          city={primaryCity}
          role="primary"
          onSelectCity={onSelectCity}
        />
      )}
      {isUsableCity(comparisonCity) && (
        <SelectedCityMarker
          city={comparisonCity}
          role="comparison"
          offset={primaryKey === comparisonKey ? 0.025 : 0}
          onSelectCity={onSelectCity}
        />
      )}
    </group>
  );
}

function GlobeContents({
  cities,
  primaryCity,
  comparisonCity,
  focusCity,
  onSelectCity,
  zoomLevel,
}) {
  const controlsRef = useRef(null);
  const flightRef = useRef(false);
  const usableCities = useMemo(
    () => (Array.isArray(cities) ? cities.filter(isUsableCity) : []),
    [cities],
  );

  return (
    <>
      <ambientLight intensity={0.15} color="#486273" />
      <hemisphereLight args={["#9bd8f2", "#02060e", 0.32]} />
      <directionalLight
        position={SUN_POSITION.toArray()}
        intensity={1.95}
        color="#ecfaff"
      />
      <directionalLight position={[-4, -2, -3]} intensity={0.16} color="#1f5f89" />

      <Stars
        radius={42}
        depth={20}
        count={1650}
        factor={1.05}
        saturation={0.08}
        fade
        speed={0.12}
      />

      <Earth cities={usableCities} onSelectCity={onSelectCity} />
      <CityMarkers
        cities={usableCities}
        primaryCity={primaryCity}
        comparisonCity={comparisonCity}
        onSelectCity={onSelectCity}
      />
      <CameraFlight
        focusCity={focusCity}
        primaryCity={primaryCity}
        comparisonCity={comparisonCity}
        zoomLevel={zoomLevel}
        controlsRef={controlsRef}
        flightRef={flightRef}
      />
      <SceneControls controlsRef={controlsRef} flightRef={flightRef} />
    </>
  );
}

export function GlobeScene({
  cities = [],
  primaryCity = null,
  comparisonCity = null,
  focusCity = null,
  onSelectCity,
  timeValue = 0,
  zoomLevel = "country",
}) {
  return (
    <div
      aria-label="可旋转的三维地球与城市事件地图"
      role="img"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        touchAction: "none",
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [1.54, 5.04, -5.04], fov: 42, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#02070f", 0);
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.92;
        }}
      >
        <Suspense fallback={null}>
          <GlobeContents
            cities={cities}
            primaryCity={primaryCity}
            comparisonCity={comparisonCity}
            focusCity={focusCity}
            onSelectCity={onSelectCity}
            timeValue={timeValue}
            zoomLevel={zoomLevel}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useTexture.preload("/textures/earth_day_8192.jpg");
useTexture.preload("/textures/earth_topography_5400.jpg");
useTexture.preload("/textures/earth_specular_2048.jpg");
useTexture.preload("/textures/earth_night_8192.jpg");
useTexture.preload("/textures/earth_clouds_2048.jpg");
