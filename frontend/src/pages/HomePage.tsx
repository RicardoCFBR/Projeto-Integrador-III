import { Link } from "react-router-dom";

export function HomePage() {
    return (
        <>
            <section className="hero-card">
                <span className="eyebrow">Projeto base Univesp</span>
                <h1>Operação do bar em uma tela clara e pronta para crescer.</h1>
                <p>
                    Esta base já separa backend Django e frontend React, mantém a API
                    preparada para comandas e pedidos, e deixa o dashboard conectado
                    para a próxima etapa do projeto.
                </p>

                <div className="hero-actions">
                    <Link
                        aria-label="Abrir dashboard de vendas"
                        className="button-primary"
                        to="/dashboard"
                    >
                        Abrir dashboard
                    </Link>
                    <a
                        className="button-secondary"
                        href="http://127.0.0.1:8000/api/dashboard/"
                        rel="noreferrer"
                        target="_blank"
                    >
                        Ver API do Django
                    </a>
                </div>
            </section>

            <section className="split-grid" aria-label="Resumo da arquitetura">
                <article className="panel">
                    <h2>Backend</h2>
                    <p>
                        Django com Django REST Framework, SQLite para desenvolvimento,
                        CORS configurado para o Vite e modelos iniciais de Produto,
                        Comanda e Pedido.
                    </p>
                </article>

                <article className="panel">
                    <h2>Frontend</h2>
                    <p>
                        React com Vite, navegação básica, HTML semântico e dashboard
                        com gráfico de vendas por dia usando Recharts.
                    </p>
                </article>
            </section>
        </>
    );
}
