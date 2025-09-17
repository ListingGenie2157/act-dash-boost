import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card'
import { Upload, AlertTriangle, Check, X, FileText, Database } from 'lucide-react'

interface ImportStats {
  formsCreated: number
  questionsCreated: number
  questionsSkipped: number
  passagesCreated: number
  errors: string[]
}

export function AdminImport() {
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check admin access
    if (!isAdmin) {
      navigate({ to: '/dashboard' })
    }
  }, [isAdmin, navigate])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/tab-separated-values' && !selectedFile.name.endsWith('.tsv')) {
        setError('Please select a TSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
      setStats(null)
    }
  }

  const handleImport = async () => {
    if (!file || !user) return

    setLoading(true)
    setError(null)
    setStats(null)

    try {
      // Read file content
      const content = await file.text()
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Call Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tsv: content }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      setStats(result.stats)
      setFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during import')
      console.error('Import error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Content Import</h1>
          <p className="text-gray-600">Import ACT questions and content from TSV files</p>
        </div>

        {/* Warning */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              <CardTitle className="text-orange-900">Important</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Only administrators can import content</li>
              <li>• Duplicate questions (by stem hash) will be skipped</li>
              <li>• Import is idempotent - safe to run multiple times</li>
              <li>• Large files may take several minutes to process</li>
            </ul>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload TSV File</CardTitle>
            <CardDescription>
              Select a tab-separated values file containing ACT questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  id="file-input"
                  type="file"
                  accept=".tsv,text/tab-separated-values"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Click to select a TSV file or drag and drop
                  </p>
                  <p className="text-sm text-gray-500">
                    Maximum file size: 10MB
                  </p>
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-500 mr-2" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFile(null)
                      setStats(null)
                      setError(null)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                onClick={handleImport}
                disabled={!file || loading}
                loading={loading}
                className="w-full"
              >
                <Database className="w-4 h-4 mr-2" />
                Import Content
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Results */}
        {stats && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center">
                <Check className="w-5 h-5 text-green-600 mr-2" />
                <CardTitle className="text-green-900">Import Successful</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.formsCreated}
                  </div>
                  <div className="text-xs text-gray-600">Forms Created</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.questionsCreated}
                  </div>
                  <div className="text-xs text-gray-600">Questions Added</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.questionsSkipped}
                  </div>
                  <div className="text-xs text-gray-600">Duplicates Skipped</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.passagesCreated}
                  </div>
                  <div className="text-xs text-gray-600">Passages Created</div>
                </div>
              </div>

              {stats.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {stats.errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TSV Format Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>TSV Format</CardTitle>
            <CardDescription>
              Expected column headers for the TSV file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Column</th>
                    <th className="text-left py-2 pr-4">Required</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">subject</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Subject area</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">form_id</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Form identifier</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">section</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">EN, MATH, RD, or SCI</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">ord</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Question order number</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">passage_title</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Title of associated passage</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">passage_body</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Passage text content</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">stem</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Question text</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">choice_a</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Answer choice A</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">choice_b</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Answer choice B</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">choice_c</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Answer choice C</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">choice_d</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Answer choice D</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">correct_label</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Correct answer (A, B, C, or D)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">difficulty</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">1-5 difficulty rating</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 pr-4 font-mono">topics</td>
                    <td className="py-2 pr-4">No</td>
                    <td className="py-2">Skill/topic tags</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono">explanation</td>
                    <td className="py-2 pr-4">Yes</td>
                    <td className="py-2">Answer explanation</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}