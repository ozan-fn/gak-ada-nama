import { GithubIcon } from '@/components/GithubIcon'
import { ArrowUpRight, Mail } from 'lucide-react'
import { FaLinkedin } from 'react-icons/fa'
import { motion } from 'framer-motion'
import iyanImage from '@/assets/images/iyan.jpg'
import fauzanImage from '@/assets/images/fauzan.jpg'
import firmanImage from '@/assets/images/firman.jpg'

const team = [
  {
    name: 'Firman Zamzami',
    role: 'AI Engineer',
    tag: 'Artificial Intelligence',
    image: firmanImage,
    linkedin: 'https://linkedin.com/in/firman-zamzami-aziz',
    github: 'https://github.com/firmanzaziz',
    email: 'firman@prita.id',
  },
  {
    name: 'Akhmad Fauzan',
    role: 'Fullstack & Blockchain Developer',
    tag: 'Blockchain',
    image: fauzanImage,
    linkedin: 'https://linkedin.com/in/akhmad-fauzan',
    github: 'https://github.com/akhmadfauzan',
    email: 'fauzan@prita.id',
  },
  {
    name: 'Agus Priyanto',
    role: 'Frontend Developer',
    tag: 'Frontend Engineering',
    image: iyanImage,
    linkedin: 'https://linkedin.com/in/agus-priyanto',
    github: 'https://github.com/aguspriyanto',
    email: 'agus@prita.id',
  },
]

export default function TeamSection() {
  return (
    <section className="relative z-10 bg-gray-100 py-18 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mb-10 mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
            Tim Kami
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
            Orang-Orang di Balik Prita
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            Tim multidisiplin yang berdedikasi membangun masa depan monitoring
            lingkungan dengan teknologi AI.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group overflow-hidden rounded-lg border border-gray-300 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Photo */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-200">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
                />
                <span className="absolute right-3 top-3 rounded-full bg-gray-900 px-2.5 py-1 text-xs text-white">
                  {member.tag}
                </span>
              </div>

              {/* Info */}
              <div className="relative p-5">
                <div className="absolute right-5 bottom-5 text-5xl font-semibold text-gray-100 transition-all duration-300 group-hover:text-gray-200">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm font-medium text-gray-900 transition-transform duration-300 group-hover:translate-x-1">
                  {member.role}
                </p>

                <div className="my-3 flex items-center justify-between">
                  <div className="h-px w-12 bg-gray-200 transition-all duration-300 group-hover:w-20 group-hover:bg-gray-900" />
                  <ArrowUpRight className="h-4 w-4 text-gray-500 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-gray-900" />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-900 hover:text-gray-900"
                    aria-label={`LinkedIn ${member.name}`}
                  >
                    <FaLinkedin className="h-4 w-4" />
                  </a>
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-900 hover:text-gray-900"
                    aria-label={`GitHub ${member.name}`}
                  >
                    <GithubIcon className="h-4 w-4" />
                  </a>
                  <a
                    href={`mailto:${member.email}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-900 hover:text-gray-900"
                    aria-label={`Email ${member.name}`}
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
