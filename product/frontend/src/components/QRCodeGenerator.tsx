import { QRCodeSVG } from 'qrcode.react'

interface QRCodeGeneratorProps {
  code: number
  claimUrl: string
}

const QRCodeGenerator = ({ code, claimUrl }: QRCodeGeneratorProps) => {
  return (
    <div style={{ margin: '1em', backgroundColor: 'white' }}>
      <p>コード: {code.toString().padStart(4, '0')}</p>
      <QRCodeSVG
        value={claimUrl}
        size={200}
        level="M"
        fgColor="#111"
        bgColor="#fff"
        imageSettings={{
          src: '/assets/ENBANKED(svg).svg',
          height: 40,
          width: 40,
          excavate: true,
        }}
      />
      <p>
        <a href={claimUrl} target="_blank" rel="noreferrer">
          {claimUrl}
        </a>
      </p>
    </div>
  )
}

export default QRCodeGenerator