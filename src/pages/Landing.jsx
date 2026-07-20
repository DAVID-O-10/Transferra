import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { FiShield, FiZap, FiClock, FiUploadCloud, FiLink, FiDownload } from 'react-icons/fi'

// ─── 3D Scene Components ──────────────────────────────────────────────────────

function FloatingShapes() {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05
    }
  })

  const shapes = useMemo(() => [
    { type: 'icosahedron', args: [1, 1], position: [-3.5, 0.5, -2], color: '#22d3ee', speed: 1.8, distort: 0.35, scale: 1.2 },
    { type: 'torus', args: [0.8, 0.3, 32, 64], position: [3, -0.5, -3], color: '#3b82f6', speed: 1.2, distort: 0.25, scale: 1.0 },
    { type: 'sphere', args: [0.6, 64, 64], position: [-1.5, -1.5, -1.5], color: '#06b6d4', speed: 2.0, distort: 0.4, scale: 0.9 },
    { type: 'icosahedron', args: [0.7, 0], position: [2, 1.5, -2.5], color: '#8b5cf6', speed: 1.5, distort: 0.2, scale: 0.8 },
    { type: 'torus', args: [0.5, 0.2, 32, 64], position: [-2.5, 1.5, -4], color: '#22d3ee', speed: 1.0, distort: 0.15, scale: 0.7 },
    { type: 'sphere', args: [0.4, 64, 64], position: [4, 0, -3.5], color: '#3b82f6', speed: 2.2, distort: 0.3, scale: 1.1 },
    { type: 'icosahedron', args: [0.5, 1], position: [0.5, 2, -5], color: '#06b6d4', speed: 1.3, distort: 0.2, scale: 0.6 },
  ], [])

  return (
    <group ref={groupRef}>
      {shapes.map((shape, i) => (
        <Float
          key={i}
          speed={shape.speed}
          rotationIntensity={0.4}
          floatIntensity={0.6}
        >
          <mesh position={shape.position} scale={shape.scale}>
            {shape.type === 'icosahedron' && <icosahedronGeometry args={shape.args} />}
            {shape.type === 'torus' && <torusGeometry args={shape.args} />}
            {shape.type === 'sphere' && <sphereGeometry args={shape.args} />}
            <MeshDistortMaterial
              color={shape.color}
              speed={shape.speed}
              distort={shape.distort}
              roughness={0.15}
              metalness={0.85}
              transparent
              opacity={0.7}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function CameraRig() {
  useFrame(({ mouse, camera }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.x * 0.5, 0.02)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.y * 0.3, 0.02)
    camera.lookAt(0, 0, 0)
  })
  return null
}

function Scene() {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#22d3ee" />
      <Environment preset="night" />
      <FloatingShapes />
      <fog attach="fog" args={['#000000', 5, 15]} />
    </>
  )
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function Landing() {
  const features = [
    {
      icon: <FiShield className="w-7 h-7" />,
      title: 'Zero-Knowledge Privacy',
      description: 'Your files are encrypted end-to-end. We never see what you send — only you hold the keys.',
    },
    {
      icon: <FiZap className="w-7 h-7" />,
      title: 'Lightning Fast',
      description: 'Upload to Cloudflare edge locations worldwide. Downloads start instantly, no matter where you are.',
    },
    {
      icon: <FiClock className="w-7 h-7" />,
      title: 'Smart Retention',
      description: 'Files auto-expire for security, but you control the timeline. Set it and forget it.',
    },
  ]

  const steps = [
    {
      icon: <FiUploadCloud className="w-6 h-6" />,
      title: 'Upload',
      description: 'Drag & drop or click to select your file. Set expiry, password, and download limits.',
    },
    {
      icon: <FiLink className="w-6 h-6" />,
      title: 'Share',
      description: 'Get a unique code and shareable link instantly. Send it however you like.',
    },
    {
      icon: <FiDownload className="w-6 h-6" />,
      title: 'Download',
      description: 'Recipient enters the code, decrypts in-browser, and saves the file. Done.',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* ─── Navbar ──────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="text-2xl font-bold tracking-tight">
          Transferra
        </div>
        <div className="flex items-center gap-5">
          <a
            href="/auth"
            className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
          >
            Sign In
          </a>
          <a
            href="/auth"
            className="bg-white text-black px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all duration-200 hover:scale-105"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* ─── Hero Section ───────────────────────────────── */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center">
        {/* 3D Canvas Background */}
        <div className="absolute inset-0 z-0">
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            dpr={[1, 1.5]}
            gl={{ antialias: true, alpha: false }}
            style={{ background: '#000000' }}
          >
            <Scene />
          </Canvas>
        </div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-black/30 to-black/70 pointer-events-none" />

        {/* Hero Text Overlay */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-20 text-center px-6 max-w-3xl mx-auto pointer-events-auto"
        >
          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
          >
            Transfer Files.
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Privately. Fast.
            </span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            End-to-end encrypted file transfers with zero-knowledge privacy.
            Send anything to anyone — no account needed.
          </motion.p>
          <motion.div variants={fadeUp} custom={2}>
            <a
              href="/auth"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-3.5 rounded-lg font-semibold text-lg hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200"
            >
              Start Transferring
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── How It Works ───────────────────────────────── */}
      <section className="relative z-20 py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            >
              Three steps. That's it.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-gray-400 text-lg max-w-xl mx-auto"
            >
              No sign-ups. No bloat. Just fast, secure file transfers.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="relative text-center group"
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-gradient-to-r from-cyan-500/30 to-transparent" />
                )}
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400/40 transition-all duration-300">
                  {step.icon}
                </div>
                <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features Section ───────────────────────────── */}
      <section className="relative z-20 py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            >
              Built for speed. Designed for privacy.
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-gray-400 text-lg max-w-2xl mx-auto"
            >
              Every feature is purpose-built to make file transfers fast, private, and effortless.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="group bg-[#111827] border border-[#1f2937] rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────── */}
      <section className="relative z-20 py-24 px-6 md:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            variants={fadeUp}
            className="bg-gradient-to-b from-[#111827] to-[#0a0f1a] border border-[#1f2937] rounded-3xl p-12 md:p-16 relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Ready to send something?
              </h2>
              <p className="text-gray-400 text-lg max-w-lg mx-auto mb-8">
                No account required. No traces left behind. Just you, your file, and a encrypted link.
              </p>
              <a
                href="/auth"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white px-8 py-3.5 rounded-lg font-semibold text-lg hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200"
              >
                Get Started Free
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─────────────────────────────────────── */}
      <footer className="relative z-20 border-t border-[#1f2937] py-10 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Transferra. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors duration-200">Privacy</a>
            <a href="#" className="hover:text-white transition-colors duration-200">Terms</a>
            <a href="#" className="hover:text-white transition-colors duration-200">Security</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
