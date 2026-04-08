interface RulerProps {
  direction: 'horizontal' | 'vertical';
  lengthPx: number;
}

export function Ruler({ direction, lengthPx }: RulerProps) {
  // Choose tick interval based on size
  const step = lengthPx <= 200 ? 25 : lengthPx <= 500 ? 50 : lengthPx <= 1500 ? 100 : 200;
  const ticks: number[] = [];
  for (let i = 0; i <= lengthPx; i += step) {
    ticks.push(i);
  }

  const isH = direction === 'horizontal';

  if (isH) {
    return (
      <div className="relative h-5 w-full overflow-hidden select-none" style={{ marginBottom: 2 }}>
        <svg width="100%" height="20" viewBox={`0 0 ${lengthPx} 20`} preserveAspectRatio="none">
          {ticks.map(t => {
            const isMajor = t % (step * 2) === 0 || t === 0;
            return (
              <g key={t}>
                <line
                  x1={t} y1={isMajor ? 0 : 8} x2={t} y2={20}
                  stroke="hsl(var(--muted-foreground))" strokeWidth={1} opacity={0.5}
                />
                {isMajor && (
                  <text
                    x={t + 2} y={10}
                    fill="hsl(var(--muted-foreground))"
                    fontSize={8} opacity={0.7}
                  >
                    {t}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className="relative w-5 select-none" style={{ marginRight: 2 }}>
      <svg width="20" height="100%" viewBox={`0 0 20 ${lengthPx}`} preserveAspectRatio="none" style={{ height: '100%' }}>
        {ticks.map(t => {
          const isMajor = t % (step * 2) === 0 || t === 0;
          return (
            <g key={t}>
              <line
                x1={isMajor ? 0 : 8} y1={t} x2={20} y2={t}
                stroke="hsl(var(--muted-foreground))" strokeWidth={1} opacity={0.5}
              />
              {isMajor && (
                <text
                  x={2} y={t + 10}
                  fill="hsl(var(--muted-foreground))"
                  fontSize={8} opacity={0.7}
                  transform={`rotate(-90, 2, ${t + 10})`}
                >
                  {t}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
