"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRM } from "@pixiv/three-vrm";
import { VRMAnimation } from "@pixiv/three-vrm-animation";

export interface VRMRendererProps {
  modelUrl?: string;
  animationUrl?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function VRMRenderer({
  modelUrl = "/api/vrm/AvatarSample_B.vrm",
  animationUrl = "/api/vrm/VRMA_01.vrma",
  className,
  style,
}: VRMRendererProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    // #region THREE.js initialization
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene(); // scene
    scene.background = new THREE.Color(0xffffff);
    scene.add(new THREE.AmbientLight(0xffffff, 4)); // ambient light

    const camera = new THREE.PerspectiveCamera( // camera
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      20,
    );
    camera.position.set(0, 1.4, 1.5); // Left/right, up/down, forward/backward

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // renderer
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Improve material stability and color correctness for MToon/VRM materials
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.sortObjects = true;
    container.appendChild(renderer.domElement);
    // #endregion

    const loader = new GLTFLoader(); // VRM loader
    loader.register((parser) => new VRMLoaderPlugin(parser)); // register VRM loader plugin

    let currentVRM: VRM | null = null;
    let disposeMixer: (() => void) | null = null;

    loader.load(
      modelUrl, // model URL
      (gltf) => {
        // called when the resource is loaded
        const vrm: VRM = gltf.userData.vrm;

        if (vrm) {
          currentVRM = vrm;
          scene.add(vrm.scene);
        } else if (gltf.scene) {
          // if no VRM, add the scene
          scene.add(gltf.scene);
        }

        // If an animation is provided, load and play it once the model is ready
        if (animationUrl) {
          const animLoader = new GLTFLoader();
          // VRMA is GLB-based; no special plugin needed for parsing basic clips
          animLoader.load(
            animationUrl,
            (animGltf) => {
              const clips = animGltf.animations ?? [];
              if (clips.length === 0) return;

              const targetObject = currentVRM?.scene ?? scene;
              const mixer = new THREE.AnimationMixer(targetObject);
              mixerRef.current = mixer;
              const actions = clips.map((clip) => mixer.clipAction(clip));
              actions.forEach((action) => {
                action.reset();
                action.play();
              });
              disposeMixer = () => {
                actions.forEach((action) => action.stop());
                mixer.stopAllAction();
              };
            },
            undefined,
            (error) => {
              console.error("Failed to load VRMA:", error);
            },
          );
        }
      },
      undefined,
      (error) => {
        console.error("Failed to load VRM:", error);
      },
    );

    const clock = new THREE.Clock();
    const renderLoop = () => {
      // If using VRM with animations, some implementations expose update(delta)
      try {
        const delta = clock.getDelta();
        if (currentVRM && typeof currentVRM.update === "function") {
          currentVRM.update(delta);
        }
        if (mixerRef.current) {
          mixerRef.current.update(delta);
        }
      } catch {
        // no-op
      }
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };
    animationFrameRef.current = requestAnimationFrame(renderLoop);

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height || 1;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", handleResize);
      try {
        if (disposeMixer) disposeMixer();
        mixerRef.current = null;
        renderer.dispose();
        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
      } catch {
        // ignore cleanup errors
      }
    };
  }, [modelUrl, animationUrl]);

  return (
    <div ref={containerRef} className={`${className} relative h-full w-full`} />
  );
}
