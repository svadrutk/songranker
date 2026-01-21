import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { SessionSong } from '@/lib/api';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs'; // Use nodejs runtime for file system access

// Font loading logic
async function loadFonts() {
  const blackPath = path.join(process.cwd(), 'public/fonts/Geist-Black.woff2');
  const monoBoldPath = path.join(process.cwd(), 'public/fonts/GeistMono-Bold.woff2');
  
  const [blackData, monoBoldData] = await Promise.all([
    fs.readFile(blackPath),
    fs.readFile(monoBoldPath),
  ]);

  return { blackData, monoBoldData };
}

export async function POST(req: NextRequest) {
  try {
    const { songs, orderId, dateStr, timeStr } = await req.json();
    const top10 = songs.slice(0, 10);
    const { blackData, monoBoldData } = await loadFonts();

    // Calculate barcode pattern (stable based on songs)
    const seed = top10.reduce((acc: number, s: SessionSong) => acc + s.name.length, 0);
    const barcodePattern = [...Array(80)].map((_, i) => ({
      width: [1, 2, 4, 6][(seed + i) % 4],
      visible: ((seed * (i + 1)) % 10) > 1
    }));

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: '#000000',
            padding: '80px',
            fontFamily: '"GeistMono"',
          }}
        >
          {/* Receipt Paper */}
          <div
            style={{
              display: 'flex',
              width: '850px',
              flexDirection: 'column',
              backgroundColor: '#1a1a1a',
              color: 'white',
              position: 'relative',
            }}
          >
            {/* Top Jagged Edge - Simplified for Satori using a repeating gradient or simple shapes */}
            {/* Satori supports absolute positioning. We'll simulate the jagged edge with a row of rotated squares */}
            <div
              style={{
                position: 'absolute',
                top: '-24px',
                left: 0,
                width: '100%',
                height: '24px',
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#1a1a1a',
                    transform: 'rotate(45deg)',
                    transformOrigin: 'bottom left',
                    marginTop: '16px',
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>

            {/* Receipt Header */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '64px',
                textAlign: 'center',
                borderBottom: '2px dashed rgba(255,255,255,0.1)',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '60px',
                  fontFamily: '"GeistBlack"',
                  textTransform: 'uppercase',
                  marginBottom: '16px',
                  letterSpacing: '-2px',
                  fontWeight: 900,
                  color: '#ffffff',
                }}
              >
                SongRanker
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: '24px',
                  fontFamily: '"GeistMono"',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.4)',
                  alignItems: 'center',
                }}
              >
                <div>ORDER #SR-{orderId}</div>
                <div>{dateStr} @ {timeStr}</div>
              </div>
            </div>

            {/* List Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '48px 64px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '30px',
                  textTransform: 'uppercase',
                  borderBottom: '2px solid rgba(255,255,255,0.05)',
                  paddingBottom: '24px',
                  marginBottom: '40px',
                  fontFamily: '"GeistMono"',
                  fontWeight: 700,
                  color: '#ffffff',
                  width: '100%',
                }}
              >
                <span>TRACK / ARTIST</span>
                <span>QTY</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {top10.map((song: SessionSong, index: number) => (
                  <div key={song.song_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1, overflow: 'hidden' }}>
                      {/* Album Art */}
                      <div
                        style={{
                          display: 'flex',
                          width: '80px',
                          height: '80px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {song.cover_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={song.cover_url}
                            alt={song.name}
                            width="80"
                            height="80"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>?</div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', overflow: 'hidden', flex: 1 }}>
                        <span
                          style={{
                            fontSize: '36px',
                            fontFamily: '"GeistMono"',
                            color: 'rgba(255,255,255,0.2)',
                            width: '48px',
                            flexShrink: 0,
                          }}
                        >
                          {index + 1}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                          <p
                            style={{
                              fontSize: '36px',
                              fontFamily: '"GeistBlack"',
                              textTransform: 'uppercase',
                              letterSpacing: '-1px',
                              margin: 0,
                              marginBottom: '8px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: 900,
                              color: '#ffffff',
                            }}
                          >
                            {song.name}
                          </p>
                          <p
                            style={{
                              fontSize: '24px',
                              fontFamily: '"GeistMono"',
                              textTransform: 'uppercase',
                              letterSpacing: '2px',
                              color: 'rgba(255,255,255,0.4)',
                              margin: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontWeight: 700,
                            }}
                          >
                            {song.artist}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '30px',
                        fontFamily: '"GeistMono"',
                        color: 'rgba(255,255,255,0.2)',
                        flexShrink: 0,
                        marginLeft: '32px',
                      }}
                    >
                      1x
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer / Barcode */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 64px 80px 64px',
                gap: '40px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                <div style={{ display: 'flex', height: '128px', width: '100%', alignItems: 'stretch', gap: '4px' }}>
                  {barcodePattern.map((bar, i) => (
                    <div
                      key={i}
                      style={{
                        flex: bar.width,
                        backgroundColor: bar.visible ? 'rgba(255,255,255,0.9)' : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <p
                  style={{
                    textAlign: 'center',
                    fontSize: '24px',
                    fontFamily: '"GeistMono"',
                    color: 'rgba(255,255,255,0.2)',
                    letterSpacing: '10px',
                    marginLeft: '10px',
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  SONGRANKER.APP
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1200, // Approximate height, Satori handles flex
        fonts: [
          {
            name: 'GeistBlack',
            data: blackData,
            weight: 900,
            style: 'normal',
          },
          {
            name: 'GeistMono',
            data: monoBoldData,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );
  } catch (e: unknown) {
    console.error('Image generation failed:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return new Response(`Failed to generate image: ${errorMessage}`, { status: 500 });
  }
}
