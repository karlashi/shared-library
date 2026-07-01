import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const REGION_ID = 'barcode-scanner-region'

export function BarcodeScannerModal({
  onScan,
  onClose,
}: {
  onScan: (isbn: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    let cancelled = false
    let isRunning = false
    let stopped = false
    const scanner = new Html5Qrcode(REGION_ID, {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      verbose: false,
    })

    const stopAndClear = () => {
      if (stopped) return
      stopped = true
      scanner.stop().catch(() => {}).finally(() => scanner.clear())
    }

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (cancelled) return
          cancelled = true
          stopAndClear()
          onScanRef.current(decodedText)
        },
        () => {} // per-frame decode misses are expected, ignore
      )
      .then(() => {
        isRunning = true
        // cleanup already fired before start() resolved (e.g. modal closed instantly)
        if (cancelled) stopAndClear()
      })
      .catch(() => {
        if (!cancelled) setError(t('barcodeScanner.cameraError'))
      })

    return () => {
      cancelled = true
      if (isRunning) stopAndClear()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{t('barcodeScanner.heading')}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : <div id={REGION_ID} />}
      </div>
    </div>
  )
}
