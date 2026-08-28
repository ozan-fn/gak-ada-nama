import { createFileRoute } from '@tanstack/react-router'
import FeaturesHeroSection from '#/components/sections/features/FeaturesHeroSection'
import PipelineSection from '#/components/sections/features/PipelineSection'
import AdditionalFeaturesSection from '#/components/sections/features/AdditionalFeaturesSection'
import FeaturesCTASection from '#/components/sections/features/FeaturesCTASection'

export const Route = createFileRoute('/_public/features')({
  component: FeaturesPage,
})

function FeaturesPage() {
  return (
    <>
      <FeaturesHeroSection />
      <PipelineSection />
      <AdditionalFeaturesSection />
      <FeaturesCTASection />
    </>
  )
}
