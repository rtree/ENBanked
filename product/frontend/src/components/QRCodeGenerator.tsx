import { QRCodeSVG } from 'qrcode.react'

const APP_ID = 'app_c22b23e8101db637591586c4a8ca02b1'
const contractAddress = '0xA55b1bBa54B2d9F31f6B5a83BA2eDAc5320D0a22'


interface QRCodeGeneratorProps {
  code: number
  claimUrl: string
}

const QRCodeGenerator = ({ code, claimUrl }: QRCodeGeneratorProps) => {
  return (
    <div style={{ margin: '1em', backgroundColor: 'white', padding: '1em', borderRadius: '6px' }}>
      <p>コード: {code.toString().padStart(4, '0')}</p>
      <QRCodeSVG
        value={claimUrl}
        size={200}
        level="M"
        fgColor="#111"
        bgColor="#fff"
        imageSettings={{
          src: '/assets/ENBANKED.png',
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