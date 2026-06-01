'use client'

import React from "react"

import { useState } from 'react'
import { useCMS } from '@admin/contexts/cms-context'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Upload, X, Edit2, ImageIcon } from 'lucide-react'
import { Textarea } from '@shared/components/ui/textarea'

const updateHomepageContent = () => {}; // Declare the variable here or fix the import

export function CMSHomepageEditor() {
  const { homepage, updateHomepage } = useCMS()
  const [editingSection, setEditingSection] = useState<string | null>(null)

  if (!homepage) {
    return <div className="text-center py-8">Loading homepage content...</div>
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Simulate upload
    const url = URL.createObjectURL(file)
    if (section === 'hero') {
      updateHomepage({ heroImage: url })
    } else if (section === 'about') {
      updateHomepage({ aboutImage: url })
    } else if (section === 'cta') {
      updateHomepage({ ctaImage: url })
    }
  }

  const SectionEditor = ({ title, field, image }: { title: string; field: keyof typeof homepage; image?: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{title}</span>
          <Button size="sm" variant="outline" onClick={() => setEditingSection(editingSection === field ? null : String(field))}>
            <Edit2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {image && (
          <div className="space-y-2">
            <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
              <img src={image || "/placeholder.svg"} alt="Section image" className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-2">
              <label className="flex-1">
                <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Replace Image
                  </span>
                </Button>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, String(field).split('Image')[0].toLowerCase())} hidden />
              </label>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (field.includes('hero')) updateHomepage({ heroImage: '' })
                  else if (field.includes('about')) updateHomepage({ aboutImage: '' })
                  else if (field.includes('cta')) updateHomepage({ ctaImage: '' })
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {editingSection === field && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
            {field.includes('Title') || field.includes('title') ? (
              <Input
                placeholder="Enter title"
                value={field === 'heroTitle' ? homepage.heroTitle : field === 'ctaTitle' ? homepage.ctaTitle : homepage.aboutTitle}
                onChange={(e) => {
                  if (field === 'heroTitle') updateHomepage({ heroTitle: e.target.value })
                  else if (field === 'ctaTitle') updateHomepage({ ctaTitle: e.target.value })
                  else updateHomepage({ aboutTitle: e.target.value })
                }}
              />
            ) : (
              <Textarea
                placeholder="Enter description"
                value={field === 'heroDescription' ? homepage.heroDescription : field === 'ctaDescription' ? homepage.ctaDescription : homepage.aboutDescription}
                onChange={(e) => {
                  if (field === 'heroDescription') updateHomepage({ heroDescription: e.target.value })
                  else if (field === 'ctaDescription') updateHomepage({ ctaDescription: e.target.value })
                  else updateHomepage({ aboutDescription: e.target.value })
                }}
              />
            )}
            <Button size="sm" onClick={() => setEditingSection(null)}>
              Done Editing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="hero" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="hero">Hero Section</TabsTrigger>
        <TabsTrigger value="about">About Section</TabsTrigger>
        <TabsTrigger value="cta">CTA Section</TabsTrigger>
      </TabsList>

      <div className="space-y-4 mt-6">
        <TabsContent value="hero">
          <div className="space-y-4">
            <SectionEditor title="Hero Title" field="heroTitle" />
            <SectionEditor title="Hero Description" field="heroDescription" />
            <SectionEditor title="Hero Image" field="heroImage" image={homepage?.heroImage} />
          </div>
        </TabsContent>

        <TabsContent value="about">
          <div className="space-y-4">
            <SectionEditor title="About Title" field="aboutTitle" />
            <SectionEditor title="About Description" field="aboutDescription" />
          </div>
        </TabsContent>

        <TabsContent value="cta">
          <div className="space-y-4">
            <SectionEditor title="CTA Text" field="ctaText" />
            <SectionEditor title="CTA Button Text" field="ctaButtonText" />
          </div>
        </TabsContent>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Features ({(homepage?.features || []).length})</h4>
            <div className="space-y-2">
              {(homepage?.features || []).map((feature) => (
                <div key={feature.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
            {(!homepage?.features || homepage.features.length === 0) && (
              <p className="text-sm text-muted-foreground">No features added yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Tabs>
  )
}
