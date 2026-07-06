'use client'

import { API } from '@/lib/config'
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError('')

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      try {
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) { setError('File must have header + data rows'); return }
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const required = ['name', 'price', 'category']
        const missing = required.filter(r => !headers.includes(r))
        if (missing.length) { setError(`Missing columns: ${missing.join(', ')}`); return }

        const parsed = lines.slice(1).map((line, i) => {
          const vals = line.split(',').map(v => v.trim())
          const obj: any = {}
          headers.forEach((h, idx) => { obj[h] = vals[idx] || '' })
          return obj
        })
        setPreview(parsed.slice(0, 5))
        setFile(f)
      } catch { setError('Failed to parse CSV file') }
    }
    reader.readAsText(f)
  }

  const upload = async () => {
    if (!preview.length) return
    setUploading(true)
    setError('')
    try {
      const res = await fetch(`${API.base}/api/admin/products/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ products: preview })
      })
      const data = await res.json()
      if (res.ok) setResult(data)
      else setError(data.message || 'Upload failed')
    } catch { setError('Upload error') }
    finally { setUploading(false) }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft size={18} /> Back to Products
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bulk Product Upload</h1>
      <p className="text-gray-500 mb-6">Upload a CSV file with product data. Required columns: name, price, category</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">{file ? file.name : 'Click to upload CSV'}</p>
          <p className="text-gray-400 text-sm mt-1">name, price, category, stock, brand, description, images</p>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

        {preview.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Preview ({preview.length} products)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 border-b">
                  <th className="text-left py-2 px-2">Name</th>
                  <th className="text-left py-2 px-2">Price</th>
                  <th className="text-left py-2 px-2">Category</th>
                  <th className="text-left py-2 px-2">Stock</th>
                </tr></thead>
                <tbody>
                  {preview.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 px-2 text-gray-900">{p.name}</td>
                      <td className="py-2 px-2 text-gray-900">Rs.{p.price}</td>
                      <td className="py-2 px-2 text-gray-600">{p.category}</td>
                      <td className="py-2 px-2 text-gray-600">{p.stock || '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={upload} disabled={uploading}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {uploading ? 'Uploading...' : <><Upload size={18} /> Upload {preview.length} Products</>}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
              <CheckCircle size={20} /> Upload Complete
            </div>
            <p className="text-green-600">Created: {result.created}</p>
            {result.errors > 0 && <p className="text-red-500">Errors: {result.errors}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText size={18} /> CSV Format</h3>
        <pre className="bg-gray-50 p-4 rounded-xl text-xs text-gray-600 overflow-x-auto">
name,price,category,stock,brand,description,images,originalPrice,discount{'\n'}
Wireless Headphones,2999,Electronics,50,AudioTech,High quality wireless headphones,https://example.com/img.jpg,3999,25{'\n'}
Cotton T-Shirt,999,Fashion,100,Nike,Comfortable cotton t-shirt,,1499,33
        </pre>
        <a href="data:text/csv;charset=utf-8,name,price,category,stock,brand,description,images,originalPrice,discount%0AWireless Headphones,2999,Electronics,50,AudioTech,High quality,https://example.com/1.jpg,3999,25%0ACotton T-Shirt,999,Fashion,100,Nike,Comfortable,https://example.com/2.jpg,1499,33"
          download="sample-products.csv"
          className="mt-3 inline-flex items-center gap-2 text-blue-600 text-sm hover:text-blue-700"
        >
          <Download size={16} /> Download Sample CSV
        </a>
      </div>
    </div>
  )
}
