"use client";

import { useMemo, type JSX } from "react";
import type { SessionSong } from "@/lib/api";

type ShareVisualProps = {
  songs: SessionSong[];
  orderId: number;
  dateStr: string;
  timeStr: string;
};

export function ShareVisual({ songs, orderId, dateStr, timeStr }: ShareVisualProps): JSX.Element {
  const top10 = songs.slice(0, 10);
  
  const barcodePattern = useMemo(() => {
    // Generate a pseudo-random but stable pattern based on the songs
    const seed = songs.reduce((acc, s) => acc + s.name.length, 0);
    return [...Array(80)].map((_, i) => ({
      width: [1, 2, 4, 6][(seed + i) % 4],
      visible: ((seed * (i + 1)) % 10) > 1
    }));
  }, [songs]);

  return (
    <div 
      id="share-visual"
      className="w-[1080px] bg-black p-20 flex flex-col items-center justify-start"
      style={{ 
        minHeight: '1200px',
        backgroundColor: '#000000', 
        color: '#ffffff'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @font-face { 
          font-family: 'Geist-Export-Black'; 
          src: url('data:font/woff2;base64,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') format('woff2'); 
          font-weight: 900; 
        }
        @font-face { 
          font-family: 'GeistMono-Export-Bold'; 
          src: url('data:font/woff2;base64,d09GMgABAAAAADvEABAAAAAAkSAAADthAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGm4bhXgcyj4GYD9TVEFURACFBBEICoGeCPo2C4UYAAE2AiQDihoEIAWENgeVQQwHG5t7BezYI7BxAIbn9f5GImzWImUYhcDGATQPfd/q/1MCJ0Ms7R7QeddjdwQ3SVILV5YjKMqmdqW8MLEsygUow5fxoQn9XxDrGexyR3+Xf2RHUIav0H/qqxY/dA6SutGI51/Pc0do7JMk9+f5bf459z1AEZkiKlNwT0SUB2jjs2LFXBi5NuqL+q25dlV+cRtz7VyVP3pRxtfhXJVz7e9SqHKy3btPykCGCoWxNUYC8VTn/1edzoUm8zwP+pZW4orGCsCOStLNQ/9rvztv9+PS/qGEheRRPBS6ScmikdAIldIoEarPELllYz/lpNjAQlEUEBBpAtLcpUqrig2w1MUCtoL2u1ztucR46e0uOZNISrvrn0vpprZL/QIIMNE25OppPpj5MjEscJ/dO9vO/nQfiuQuq0Coesr3Ljxvu3+7aGUWYYMMn9+ns6oS2O/VVy9iBMfZXYwhUHeXLdmeMS+C1z5SKqVLQOlxOjB4LRD7Z2rbVebi/0xN2xkMwbcAFRbH0zucUnJKRaOQStWuXNSuZufPYidgiQVBPgJL6gjieDYBUr7FZRwUAMIBgBPZOcROIVd2XkJp4Qg6Rb5zFVIZY1GqaB179Z1LqbSKsnRR+v/m+tfu/bNZ+PkI6pdA1id5+4lVEYR8mzuT2012Xj4wuGJmpjCZ3RIqAkXgEFSPJ+Eq1K+sq62yrvD///u1+jasi0uciIdqtYzYHTjgCY8/4au7tk6lmYVMCZgsMz0Shj1wLWWqsawlGOj167t+DvtUDyI7B85xORtEKIsIHc3SkYUQQtR177/pea1ZFS5e1A3Jm3UUM0grUXHFCV/n0i8QIAQxAAAA6Qh2IFqI3kTIZEWQEuWQCoug4xwHqlIFGmIIlAbDoIw0CsoEE0EQAoAIABEIzxANhoVPFQIgRC0OWW+D5HQQH7Z3bQWIoQGA0SIAIOQBlEF6+E4GZhKhYa0SWHx8bQ4QIQjGLiQwqhFB9FAGQqgg3/YQGzAaQg7GDEQsKkJCMxLO4she/MtfMmzF73zDFq0O+cg7oSwdd5L99njFc3ablwOWPp/Et8WVscMTYkV1aPNSBMN9Fi5qtcVWubmjca2NLrLWiixrn8NLzHOWmc7QaJIxxnRrLlEEkfOmcZ461TK6JYqs1LekGG1omE5ChPAff4AC+Tal0mM4FRwVkwHxAsu0j1f7uMRHe0P7aa0LER1hyXhTFl0ea2EBNzMQGe7VySk4mYHIZG832ekGZddvFXmOXXUotDyRyIlcM0SkTTvpXZ2pGSztDxIyyaUdMXMiunWAV3thUpcssWYL8wSbWidAtGQCKSClpF4vqOxSA17ESikX7EKUTGDScMHeuKzqz2qI7HjuljPw195lPAMRK6npJbUan2tuJCf5vnvxbmovdQo0xtiuQMGz2hWmMw2UW76vn49g331NVfBov4pKE9w5oHp+PvQeVlo8H2IOKvPLgfvwaEFHdaZq0AHARJdKfzoJkMQOe8bgSMrVWO4UxlHy5kNDS89fkFBhIkSJESdBkokmm2KaGdJkypZrljnmyVekVLlK1eo0WGSJ5VZaba31NtmiWYttdthlj/0OOOiwo447CYBCgA22ACB8ABAANaepJ6gL1GGqhEqjoqmg6FsquuiOokNF8iJG4deF/ys8VrhSKC1kF5Iom5T/UV6j7KCMUygUNPkx8u1kKZlBeoZ0Hwm+3jfzF+KgoleRqUiSJ8sj3Ifc+90T3P3cPprWNk08tpv7w9jqsfNop0Wy/wlrm1pZketf+DeuJa6ZLt+5PHIpd8l1...') format('woff2'); 
          font-weight: 700; 
        }
        @font-face { 
          font-family: 'GeistMono-Export-Regular'; 
          src: url('data:font/woff2;base64,d09GMgABAAAAADl4ABAAAAAAkSgAADkYAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGm4bhTwcyj4GYD9TVEFUSACFBBEICoGeMPtVC4UYAAE2AiQDihoEIAWETgeVQQwHGxp8B8a2jIbdDqDplOXkg+O826GW1vBLIxG2g5PqNfv//5jckCGwBeqqP21YmRzbKYc6nOlubnYZOcYUohouMu7qNEK1cBcdqn3VKgejbG1Le81JLDoIBY+n0ZzniCwUcrVna1/kbDhefdmh3x+1q2Dz/b38okra0uu/DTOmQX1ydI7MlapbfVkf09lxyzPAnRyRePJ4mrOf9zbZhCWkNFB+Ls2mSxqW7EaQ8rkgteDB0isVc8wqjp9RD3JUjJqlVJBKKqrULPD8/+/3r3Ptcz9QiFVcXEYUQkGWFZKuAmAFAI7AAwnLtlUPzn25vTNIZSZbdV2BBA+Q9lGTL5fkGq5VlS88j+3ed1KUitFuE25CY5LJTehycuCGOwNeTSHq8KSb/5AEFHZAmSGLjDG5XJJLckkuR3KZhDkCGJZ1YXFUcY2OhVj9jvarre5vN9HSyrfbLjvmepz4fr7flYqQMTuyM82CmQhPqL4ArLvX6VAuJHOi47UWnNqwMQ2lbTmZCPj0xySo6/kaETdcDTnXCIzh/1TVFXCFW6dSXerW97SyeZjStgzL4R8g3B0EEgTJiABVqE7IfgkpOjElN4JulNJ6A+WGdCpV8ZRexlLa6GWKMwxT2ZKpDOOWYYzf/1yvnZvZ6XmvmGxZflcWGq0InnTydkqEandNPqBRNRJYAsv6qgrd/7VZtqP9lmmOfRcAKPrR2PfeUuEgNKV3JO3PekaeIw5TxyMpIMkOQ7mXiqBDKOtLmS6+7fd+nASwD+yDlKYOcllEdP7X78T//7cmtNDe33bVUREREWPeiFEREVV9/2tMK02/FefCZ0xDkb4IApZTNDdvai01x9Ry4gXAxyeKi+8gQDApAACAFJgrRAcxiIHEGQsZbzJkqmwondIJiiYaKEEJQiQ4vyMSlnBEzImAIBiABIAEIkxQgvN78qlCACisHvDJ0wkpIL3xstSpICUAAG1dAUDwHz8OnjdNCljXPAQBZ2M8kjbOHUJBUA0lg8qfBI4qcggWwmxdQ8RQhecGVFKQyE5LjjI4fACEHMQwd6deYEVZ25CWKLk2q1OZCihlCslLB0XZzixzQQpJXvXig5BsERNSMzWpbi0Zn4qMzOD0ZRF0pBayxpLIdIspgeOw5umdHJhsmFNRRTwFnBzpmhSJkRTLg1GLnz5DwfgG4uKUJKgmB78zBWTBB+wTjODeQR/j6FheTXvMRwou4qJ4aTXviyVgC8cF/jwWWNcc3EMIBWUWK4OKj0tDB9c930oKx7qj3VopCheMFPRp6I9h4jZlYB1H82iewOkhoymPZBJ6aG+oASjPa15QDGoC/s0p0A9t2+WZ4SAq8ZdaZc22g86wBAgk1Rq8/9KG+3Bske8BSt3aFnEYRnP5Gg7oFdJPL7JNHhJofBm6cMJcErl7a2g/kbu1uB5R5qHwC6328FimcsmQIiQMqMKAb/TIJVLjfttFeqTIUqVDRMbFx8QmJSCmpaBiYWEJidk5sHBhcUFhWX0KRFuy69BgxJGbPCSqtNmrLBJptttd0ue+xzp3vc50EHHXLYfxxzAlCIiLkAQQIBXnZZ97E2sMZZOhaHVcAC5lesAmYt8wDTxOQxvmDcZNzD2MwwMESMGvon9Jv0efo2+ko6nV5A20mbpRlovJpLNQ/XPED9gXqLOk8NU+3V3mpD1XtVC1VwlaTyTOVMZUHFz4pvKlIVLfRE55V/L99UPlreVfZb2SdlPWXhZV8te3PZwLL40u+W3lqKL7UsFZSeKr2vVFfKKXm0ZKbIKKktoVBeo...') format('woff2'); 
          font-weight: 400; 
        }
      ` }} />
      
      {/* Receipt Paper */}
      <div 
        className="w-[850px] flex flex-col relative" 
        style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}
      >
        {/* Top Jagged Edge */}
        <div className="absolute -top-6 left-0 w-full h-6 flex" style={{ overflow: 'hidden' }}>
          {[...Array(30)].map((_, i) => (
            <div key={i} className="w-8 h-8 rotate-45 transform origin-bottom-left shrink-0" style={{ marginTop: '16px', backgroundColor: '#1a1a1a' }} />
          ))}
        </div>

        {/* Receipt Header */}
        <div className="p-16 text-center border-b-2" style={{ borderColor: '#333333', borderStyle: 'dashed' }}>
          <h1 
            className="text-6xl tracking-tighter uppercase mb-4"
            style={{ fontFamily: "'Geist-Export-Black', sans-serif", fontWeight: 900, color: '#ffffff' }}
          >
            SongRanker
          </h1>
          <div 
            className="space-y-1 text-2xl font-bold"
            style={{ fontFamily: "'GeistMono-Export-Bold', monospace", color: '#666666' }}
          >
            <p style={{ color: '#666666' }}>ORDER #SR-{orderId}</p>
            <p style={{ color: '#666666' }}>{dateStr} @ {timeStr}</p>
          </div>
        </div>

        {/* List Section */}
        <div className="px-16 py-12 space-y-10">
          <div 
            className="flex justify-between text-3xl uppercase border-b-2 pb-6"
            style={{ fontFamily: "'GeistMono-Export-Bold', monospace", color: '#ffffff', borderColor: '#262626' }}
          >
            <span style={{ color: '#ffffff' }}>TRACK / ARTIST</span>
            <span style={{ color: '#ffffff' }}>QTY</span>
          </div>
          
          <div className="space-y-12">
            {top10.map((song, index) => (
              <div key={song.song_id} className="flex justify-between items-center" style={{ color: '#ffffff' }}>
                <div className="flex items-center gap-6 flex-1 min-w-0 pr-8">
                  <div className="w-20 h-20 shrink-0 border overflow-hidden" style={{ borderColor: '#333333', backgroundColor: '#262626' }}>
                    {song.cover_url ? (
                      <img 
                        src={song.cover_url} 
                        alt={song.name} 
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        loading="eager"
                        decoding="sync"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: '#333333' }}>
                        ?
                      </div>
                    )}
                  </div>
                  <div className="flex items-start gap-4 min-w-0">
                    <span 
                      className="text-4xl w-12 shrink-0"
                      style={{ fontFamily: "'GeistMono-Export-Bold', monospace", color: '#333333' }}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p 
                        className="text-4xl uppercase tracking-tight leading-none mb-2 truncate"
                        style={{ fontFamily: "'Geist-Export-Black', sans-serif", fontWeight: 900, color: '#ffffff' }}
                      >
                        {song.name}
                      </p>
                      <p 
                        className="text-2xl uppercase tracking-widest truncate"
                        style={{ fontFamily: "'GeistMono-Export-Bold', monospace", color: '#666666' }}
                      >
                        {song.artist}
                      </p>
                    </div>
                  </div>
                </div>
                <span 
                  className="text-3xl shrink-0"
                  style={{ fontFamily: "'GeistMono-Export-Bold', monospace", color: '#333333' }}
                >
                  1x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Barcode / Footer */}
        <div className="px-16 pb-20 pt-10 flex flex-col items-center gap-10">
          <div className="w-full flex flex-col gap-3">
             <div className="w-full h-32 flex items-stretch gap-1">
                {barcodePattern.map((bar, i) => (
                  <div 
                    key={i} 
                    className="flex-1" 
                    style={{ 
                      backgroundColor: bar.visible ? '#ffffff' : 'transparent',
                      flexGrow: bar.width
                    }} 
                  />
                ))}
              </div>
              <p 
                className="text-center text-2xl tracking-[1em] ml-[1em]"
                style={{ fontFamily: "'GeistMono-Export-Bold', monospace", color: '#333333' }}
              >
                SONGRANKER.APP
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
