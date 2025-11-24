'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useRef } from 'react'

function Particles() {
  const count = 2000
  const radius = 15
  const points = useRef<THREE.Points>(null)

  // Criar posições das partículas
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    positions[i3 + 0] = (Math.random() - 0.5) * radius
    positions[i3 + 1] = (Math.random() - 0.5) * radius
    positions[i3 + 2] = (Math.random() - 0.5) * radius

    // Cores neon no padrão PoolCash: verde → amarelo
    const color = new THREE.Color()
    color.setHSL(0.25 + Math.random() * 0.15, 1, 0.55) // Verde/amarelo neon

    colors[i3 + 0] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  // Criar geometria das partículas
  const particleGeometry = new THREE.BufferGeometry()
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  useFrame(() => {
    if (points.current) {
      points.current.rotation.y += 0.0008
      points.current.rotation.x += 0.0002
    }
  })

  return (
    <points ref={points}>
      <primitive object={particleGeometry} attach="geometry" />
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 75 }}>
        <ambientLight intensity={0.4} />
        
        {/* Partículas neon */}
        <Particles />

        {/* Rotação e movimento de câmera */}
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.15} />
      </Canvas>
    </div>
  )
}
