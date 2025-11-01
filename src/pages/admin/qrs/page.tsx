'use client'

import { useEffect, useMemo, useState } from 'react'
import { encodePayload } from '@/lib/codec'

type Coupon = {
  brand: string; title: string; subtitle?: string;
  benefitBadge?: string; ctaText?: string; withCoupon?: boolean;
  code: string; expireDate?: string; usageFlow?: string;
  numberButton?: string; urlType?: 'URL'|'전화'|'없음'; url?: string;
  note?: string; colors: { edge:string; fill:string; bg:string }; logo?: string;
}

export default function QrsPage(){
  const [list, setList] = useState<Coupon[]>([])
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin

  useEffect(()=>{
    if (typeof window === 'undefined') return
    const raw = localStorage.getItem('coupon:list')
    setList(raw ? JSON.parse(raw) as Coupon[] : [])
  },[])

  if (!list.length) {
    return (
      <div className="card">
        <h2 style={{marginTop:0}}>/admin/qrs</h2>
        <p style={{color:'var(--muted)'}}>저장된 쿠폰이 없습니다. 먼저 <a href="/admin/coupon-builder">/admin/coupon-builder</a>에서 “리스트에 저장”을 눌러보세요.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>/admin/qrs (저장된 쿠폰 QR 목록)</h2>
      <div className="row" style={{alignItems:'flex-start'}}>
        {list.map((c, i) => {
          const payload = encodePayload(c)
          const url = `${base}/q/${payload}`
          const qr  = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`
          return (
            <div key={i} style={{border:'1px solid rgba(255,255,255,.12)', borderRadius:12, padding:12, width:280}}>
              <div style={{fontWeight:700, marginBottom:6}}>{c.brand}</div>
              <div style={{marginBottom:8}}>{c.title}</div>
              <div className="qr" style={{textAlign:'center'}}><img src={qr} width={180} height={180} alt="qr"/></div>
              <div className="label" style={{marginTop:8}}>URL</div>
              <input className="input" readOnly value={url}/>
              <div style={{display:'flex', gap:8, marginTop:8}}>
                <a className="btn" href={url} target="_blank" rel="noreferrer">/q 열기</a>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
