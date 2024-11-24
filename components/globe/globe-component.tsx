"use client";

import { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import ReactGlobe from 'react-globe.gl';
import * as THREE from 'three';
import { useTheme } from "next-themes";

interface GlobeProps {
  forwardedRef: any;
  width: number;
  height: number;
  backgroundColor: string;
  globeImageUrl: string;
  bumpImageUrl: string;
  atmosphereColor: string;
  atmosphereAltitude: number;
  pointsData: any[];
  pointAltitude: number;
  pointColor: (d: any) => string;
  pointRadius: number;
  pointResolution: number;
  pointsMerge: boolean;
  pointLabel: (d: any) => string;
  onGlobeReady: () => void;
}

const GlobeComponent = forwardRef<any, GlobeProps>((props, _ref) => {
  const { theme } = useTheme();
  const localRef = useRef<any>();
  const { forwardedRef, ...restProps } = props;

  useImperativeHandle(forwardedRef, () => ({
    scene: () => localRef.current?.scene(),
    controls: () => localRef.current?.controls(),
    renderer: () => localRef.current?.renderer(),
    pointOfView: (params: any, duration: number) => localRef.current?.pointOfView(params, duration)
  }));

  useEffect(() => {
    if (localRef.current) {
      const scene = localRef.current.scene();
      const controls = localRef.current.controls();
      const renderer = localRef.current.renderer();

      const existingLights = scene.children.filter((child: THREE.Object3D) => 
        child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight
      );
      existingLights.forEach((light) => scene.remove(light));
      
      const ambientIntensity = theme === 'dark' ? 0.3 : 0.6;
      const directionalIntensity = theme === 'dark' ? 0.4 : 0.8;
      
      const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 0.8;
        controls.minDistance = 120;
        controls.maxDistance = 500;
        controls.enablePan = true;
        controls.panSpeed = 0.5;
        controls.autoRotate = false;
      }

      if (renderer) {
        renderer.setClearColor(0x000000, 0);
        renderer.alpha = true;
        renderer.toneMappingExposure = theme === 'dark' ? 0.5 : 0.8;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
      }

      let animationFrame: number;
      const animate = () => {
        animationFrame = requestAnimationFrame(animate);
        if (controls) controls.update();
      };
      animate();

      return () => {
        cancelAnimationFrame(animationFrame);
        existingLights.forEach((light) => scene.remove(light));
      };
    }
  }, [theme]);

  return (
    <div className="w-full h-full" style={{ background: 'transparent' }}>
      <ReactGlobe 
        ref={localRef}
        {...restProps}
        backgroundColor="rgba(0,0,0,0)"
      />
    </div>
  );
});

GlobeComponent.displayName = 'GlobeComponent';

export default GlobeComponent;