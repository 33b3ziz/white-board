import { createFileRoute, Link } from '@tanstack/react-router'
import { Pencil, Users, Download, Layers } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const features = [
    {
      icon: <Pencil className="w-12 h-12 text-cyan-400" />,
      title: 'Drawing Tools',
      description:
        'Pen, eraser, shapes, and text tools to create anything you can imagine.',
    },
    {
      icon: <Layers className="w-12 h-12 text-cyan-400" />,
      title: 'Object Management',
      description:
        'Select, move, resize, and rotate objects with ease. Full undo/redo support.',
    },
    {
      icon: <Users className="w-12 h-12 text-cyan-400" />,
      title: 'Real-time Collaboration',
      description:
        'Work together with your team in real-time. See cursors and changes instantly.',
    },
    {
      icon: <Download className="w-12 h-12 text-cyan-400" />,
      title: 'Export Options',
      description:
        'Export your work as PNG or SVG. Save locally or to the cloud.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 [letter-spacing:-0.04em]">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Whiteboard
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            A collaborative online whiteboard
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            Draw, annotate, and collaborate in real-time. Perfect for
            brainstorming, teaching, and creative work.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/board"
              className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
            >
              Start Drawing
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
