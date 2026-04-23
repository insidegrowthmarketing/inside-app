interface PageHeaderProps {
  titulo: string;
  subtitulo?: string;
  children?: React.ReactNode;
}

export function PageHeader({ titulo, subtitulo, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1
          className="text-3xl font-bold bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #2D7CDB 0%, #7B3FC9 50%, #E550A5 100%)",
          }}
        >
          {titulo}
        </h1>
        {subtitulo && (
          <p className="text-sm text-zinc-400 mt-1">{subtitulo}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
