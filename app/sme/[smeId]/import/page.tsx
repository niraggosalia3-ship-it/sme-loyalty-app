'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ImportResult {
  success: boolean
  customerId?: string
  qrCodeId?: string
  email: string
  error?: string
}

interface ImportSummary {
  total: number
  successful: number
  failed: number
}

export default function ImportCustomers() {
  const params = useParams()
  const smeId = params.smeId as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ImportResult[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setResults([])
      setSummary(null)
      setError(null)
    }
  }

  const readFileWithFileReader = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        reader.abort()
        reject(new Error('File reading timed out. Please try a smaller file or check your connection.'))
      }, 30000) // 30 second timeout
      
      reader.onload = (e) => {
        clearTimeout(timeout)
        try {
          const result = e.target?.result
          if (result && typeof result === 'string') {
            console.log('File read successfully via FileReader, length:', result.length)
            resolve(result)
          } else if (result instanceof ArrayBuffer) {
            // Convert ArrayBuffer to string
            const decoder = new TextDecoder('utf-8')
            const decoded = decoder.decode(result)
            console.log('File read successfully via FileReader (ArrayBuffer), length:', decoded.length)
            resolve(decoded)
          } else {
            reject(new Error('Failed to read file content. Unexpected result type.'))
          }
        } catch (err: any) {
          clearTimeout(timeout)
          reject(new Error(`Error processing file: ${err.message}`))
        }
      }
      
      reader.onerror = (e) => {
        clearTimeout(timeout)
        const error = reader.error
        console.error('FileReader error event:', e, 'Error object:', error)
        reject(new Error(`Error reading file: ${error?.message || 'Unknown error'}. Please make sure the file is not corrupted and try selecting it again.`))
      }
      
      reader.onabort = () => {
        clearTimeout(timeout)
        reject(new Error('File reading was cancelled'))
      }
      
      // Read as text with UTF-8 encoding
      try {
        reader.readAsText(file, 'UTF-8')
      } catch (err: any) {
        clearTimeout(timeout)
        reject(new Error(`Failed to start reading file: ${err.message}`))
      }
    })
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    // Default headers if not provided
    const defaultHeaders = ['name', 'email', 'birthdate', 'gender', 'phone', 'externalid', 'ytdspend', 'joindate']
    
    // Check if first line looks like headers (contains common header words)
    const firstLine = lines[0].toLowerCase()
    const hasHeaders = firstLine.includes('name') || 
                      firstLine.includes('email') || 
                      firstLine.includes('birth') ||
                      firstLine.includes('date')
    
    let headers: string[]
    let startIndex: number
    
    if (hasHeaders) {
      // First line is headers
      headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      startIndex = 1
    } else {
      // No headers, use default based on column count
      const firstRowCols = lines[0].split(',').length
      headers = defaultHeaders.slice(0, firstRowCols)
      startIndex = 0
    }
    
    // Parse data rows
    const data = []
    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      if (values.length === 0 || values.every(v => !v)) continue

      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      data.push(row)
    }

    return data
  }

  const handleImport = async () => {
    if (!file) {
      alert('Please select a CSV file')
      return
    }

    setImporting(true)
    setProgress(0)
    setError(null)

    try {
      // Validate file object
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file object. Please select the file again.')
      }

      // Check file size
      if (file.size === 0) {
        throw new Error('File is empty. Please select a valid CSV file with data.')
      }

      console.log('Reading file:', file.name, 'Size:', file.size, 'Type:', file.type)

      // Read file - try modern File API first, then FileReader
      let text: string
      
      // Try modern File.text() API first (simpler and more reliable)
      if (typeof file.text === 'function') {
        try {
          console.log('Using File.text() API')
          text = await file.text()
          console.log('File read successfully via File.text(), length:', text.length)
        } catch (textError: any) {
          console.warn('File.text() failed, falling back to FileReader:', textError)
          // Fall through to FileReader
          text = await readFileWithFileReader(file)
        }
      } else {
        console.log('File.text() not available, using FileReader')
        text = await readFileWithFileReader(file)
      }
      
      if (!text || text.trim().length === 0) {
        throw new Error('File appears to be empty. Please check that your CSV file contains data.')
      }
      
      console.log('File read successfully, length:', text.length)
      const customers = parseCSV(text)

      if (customers.length === 0) {
        setError('No valid customer data found in CSV file')
        setImporting(false)
        return
      }

      if (customers.length > 10000) {
        setError('Maximum 10,000 customers per import')
        setImporting(false)
        return
      }

      // Get API key first
      const apiKeyRes = await fetch(`/api/smes/id/${smeId}/api-key`)
      if (!apiKeyRes.ok) {
        throw new Error('Failed to get API key. Please generate one first.')
      }

      const apiKeyData = await apiKeyRes.json()
      if (!apiKeyData.apiKey) {
        // Generate API key if it doesn't exist
        const generateRes = await fetch(`/api/smes/id/${smeId}/api-key`, {
          method: 'POST',
        })
        if (!generateRes.ok) {
          throw new Error('Failed to generate API key. Please generate one from the customer management page first.')
        }
        const generateData = await generateRes.json()
        apiKeyData.apiKey = generateData.apiKey
      }

      const apiKey = apiKeyData.apiKey

      // Transform CSV data to API format
      const customersData = customers.map(customer => ({
        name: customer.name || customer['customer name'],
        email: customer.email || customer['email address'],
        birthDate: customer.birthdate || customer['birth date'] || customer['date of birth'],
        gender: customer.gender,
        phone: customer.phone || customer['phone number'] || undefined,
        externalId: customer.externalid || customer['external id'] || customer['customer id'] || undefined,
        ytdSpend: customer.ytdspend || customer['ytd spend'] || customer['year to date spend'] 
          ? parseFloat(customer.ytdspend || customer['ytd spend'] || customer['year to date spend']) 
          : undefined,
        joinDate: customer.joindate || customer['join date'] || customer['member since'] || undefined,
      }))

      // Call bulk import API
      const res = await fetch('/api/integration/customers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({ customers: customersData }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to import customers')
      }

      const data = await res.json()
      setResults(data.results || [])
      setSummary(data.summary || null)
      setProgress(100)
    } catch (err: any) {
      console.error('Import error:', err)
      setError(err.message || 'Failed to import customers')
    } finally {
      setImporting(false)
    }
  }

  const downloadErrorReport = () => {
    const failed = results.filter(r => !r.success)
    if (failed.length === 0) return

    const csv = [
      ['Email', 'Error'].join(','),
      ...failed.map(r => [r.email, r.error || 'Unknown error'].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-errors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Import Customers
              </h1>
              <p className="text-gray-600 mt-1">
                Bulk import existing customers with YTD spending
              </p>
            </div>
            <Link
              href={`/sme/${smeId}`}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              Back to Customers
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">CSV Format</h2>
          <p className="text-sm text-blue-800 mb-3">
            Your CSV file can include headers or just data rows. If no headers are provided, columns are assumed in this order:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1 mb-3">
            <li><strong>name</strong> (required) - Customer name</li>
            <li><strong>email</strong> (required) - Customer email</li>
            <li><strong>birthDate</strong> (required) - Format: YYYY-MM-DD</li>
            <li><strong>gender</strong> (required) - Male, Female, or Other</li>
            <li><strong>phone</strong> (optional) - Phone number</li>
            <li><strong>externalId</strong> (optional) - Your internal customer ID</li>
            <li><strong>ytdSpend</strong> (optional) - Year-to-date spending amount</li>
            <li><strong>joinDate</strong> (optional) - Customer join date (YYYY-MM-DD)</li>
          </ul>
          <p className="text-xs text-blue-700 mb-2">
            <strong>Note:</strong> Duplicate emails will be skipped. YTD spend will calculate initial points and tier.
          </p>
          <p className="text-xs text-blue-600 font-semibold">
            <strong>Example without headers:</strong> test11,test11@gmail.com,1992-02-05,Male
          </p>
          <p className="text-xs text-blue-600 font-semibold">
            <strong>Example with headers:</strong> name,email,birthDate,gender
          </p>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File (Max 10MB, 10,000 rows)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                disabled={importing}
              />
              {file && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    Selected: <span className="font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {file.type || 'text/csv'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
            >
              {importing ? `Importing... ${progress}%` : 'Import Customers'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results Summary */}
        {summary && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Results</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-blue-600">Total</p>
                <p className="text-2xl font-bold text-blue-900">{summary.total}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-sm font-medium text-green-600">Successful</p>
                <p className="text-2xl font-bold text-green-900">{summary.successful}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm font-medium text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-900">{summary.failed}</p>
              </div>
            </div>

            {summary.failed > 0 && (
              <button
                onClick={downloadErrorReport}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                Download Error Report
              </button>
            )}
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Import Details ({results.length} rows)
            </h2>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, idx) => (
                    <tr key={idx} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-4 py-2 text-gray-900">{result.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          result.success 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600 text-xs font-mono">
                        {result.customerId ? result.customerId.substring(0, 8) + '...' : '-'}
                      </td>
                      <td className="px-4 py-2 text-red-600 text-xs">
                        {result.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API Integration Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">API Integration</h2>
          <p className="text-sm text-gray-600 mb-3">
            You can also import customers programmatically using our API:
          </p>
          <div className="bg-gray-800 rounded p-4 text-sm text-green-400 font-mono overflow-x-auto">
            <div>POST /api/integration/customers/bulk</div>
            <div>Header: X-API-Key: your-api-key</div>
            <div>Body: {'{'} "customers": [...] {'}'}</div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Generate your API key from the customer management page.
          </p>
        </div>
      </div>
    </div>
  )
}

