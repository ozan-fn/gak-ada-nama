import { createFileRoute } from '@tanstack/react-router'
import AboutSection from '#/components/sections/about/AboutSection'
import TeamSection from '#/components/sections/about/TeamSection'

export const Route = createFileRoute('/_public/about')({
  component: AboutPage,
})

function AboutPage() {
  return (
    <>
      <AboutSection />
      <TeamSection />
    </>
  )
}
