# BarControl

Estrutura inicial do projeto para a Univesp com:

- `backend/`: Django + Django REST Framework
- `frontend/`: React + Vite
- `.github/workflows/`: pipeline inicial de CI
- `docs/`: documentação do projeto

## Backend

- API em Django com modelos iniciais de `Produto`, `Comanda` e `Pedido`
- Endpoint de dashboard em `GET /api/dashboard/`
- Banco SQLite para desenvolvimento

## Frontend

- React com roteamento básico
- Página `/dashboard` consumindo a API do Django
- Gráfico de vendas por dia com `recharts`
