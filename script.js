document.addEventListener('DOMContentLoaded', () => {
    const formAgendamento = document.getElementById('form-agendamento');
    const formLoginAdmin = document.getElementById('form-login-admin');

    function obterAgendamentos() {
        return JSON.parse(localStorage.getItem('agendamentos')) || [];
    }

    function salvarAgendamentos(lista) {
        localStorage.setItem('agendamentos', JSON.stringify(lista));
    }

    function formatarDataBR(dataISO) {
        if (!dataISO) return '';
        return dataISO.split('-').reverse().join('/');
    }

    function formatarMoeda(valor) {
        return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    if (formAgendamento) iniciarAreaCliente();
    if (formLoginAdmin) iniciarAreaAdmin();

    function iniciarAreaCliente() {
        const selectServico = document.getElementById('servico');
        const inputValor = document.getElementById('valor');
        const displayValorTotal = document.getElementById('display-valor-total');
        const displayValorSinal = document.getElementById('display-valor-sinal');
        const inputData = document.getElementById('data');
        const modalPix = document.getElementById('modal-pix');
        const modalValorSinal = document.getElementById('modal-valor-sinal');
        const modalLoginCliente = document.getElementById('modal-login-cliente');
        let ultimoIdAgendado = null;

        inputData.setAttribute('min', new Date().toISOString().split('T')[0]);
        verificarSessaoCliente();

        document.getElementById('btn-abrir-login-cliente').onclick = () => modalLoginCliente.style.display = 'flex';
        document.getElementById('btn-fechar-login-cliente').onclick = () => modalLoginCliente.style.display = 'none';

        document.getElementById('form-login-cliente').onsubmit = (e) => {
            e.preventDefault();
            const usuario = {
                nome: document.getElementById('login-cliente-nome').value.trim(),
                email: document.getElementById('login-cliente-email').value.trim().toLowerCase()
            };
            localStorage.setItem('clienteLogado', JSON.stringify(usuario));
            modalLoginCliente.style.display = 'none';
            verificarSessaoCliente();
        };

        document.getElementById('btn-sair-cliente').onclick = () => {
            localStorage.removeItem('clienteLogado');
            verificarSessaoCliente();
        };

        function verificarSessaoCliente() {
            const usuario = JSON.parse(localStorage.getItem('clienteLogado'));
            const painelMeus = document.getElementById('painel-meus-agendamentos');
            const btnLogin = document.getElementById('btn-abrir-login-cliente');

            if (usuario) {
                btnLogin.textContent = 'Olá, ' + usuario.nome.split(' ')[0];
                document.getElementById('cliente').value = usuario.nome;
                document.getElementById('email-cliente').value = usuario.email;
                document.getElementById('subtitulo-cliente-logado').textContent = 'Conta: ' + usuario.email;
                painelMeus.style.display = 'block';
                renderizarMeusHorarios(usuario.email);
            } else {
                btnLogin.textContent = 'Entrar / Meus Horários';
                painelMeus.style.display = 'none';
            }
        }

        function renderizarMeusHorarios(email) {
            const tbody = document.getElementById('tabela-meus-horarios');
            const vazio = document.getElementById('vazio-meus-horarios');
            const meus = obterAgendamentos().filter(item => item.email === email);

            tbody.innerHTML = '';
            vazio.style.display = meus.length === 0 ? 'block' : 'none';

            meus.forEach(item => {
                let badge = 'badge-warning';
                if (item.status === 'Confirmado (Pix)') badge = 'badge-info';
                if (item.status === 'Concluído') badge = 'badge-success';

                const tr = document.createElement('tr');
                tr.innerHTML =
                    '<td><strong>' + formatarDataBR(item.data) + '</strong> às ' + item.hora + '</td>' +
                    '<td>' + item.servico + '</td>' +
                    '<td>' + formatarMoeda(item.valor) + '</td>' +
                    '<td>' + formatarMoeda(item.sinal) + '</td>' +
                    '<td><span class="badge ' + badge + '">' + item.status + '</span></td>';
                tbody.appendChild(tr);
            });
        }
        selectServico.onchange = () => {
            const opt = selectServico.options[selectServico.selectedIndex];
            const preco = parseFloat(opt.getAttribute('data-preco')) || 0;
            inputValor.value = preco;
            displayValorTotal.textContent = formatarMoeda(preco);
            displayValorSinal.textContent = formatarMoeda(preco * 0.30);
        };

        formAgendamento.onsubmit = (e) => {
            e.preventDefault();
            const dataSel = document.getElementById('data').value;
            const horaSel = document.getElementById('hora').value;
            const agendamentos = obterAgendamentos();

            if (agendamentos.some(i => i.data === dataSel && i.hora === horaSel && i.status !== 'Cancelado')) {
                alert('Este horário já está reservado! Escolha outro.');
                return;
            }

            const nome = document.getElementById('cliente').value.trim();
            const email = document.getElementById('email-cliente').value.trim().toLowerCase();
            const valor = parseFloat(inputValor.value) || 0;
            const sinal = valor * 0.30;

            const novo = {
                id: Date.now(),
                cliente: nome,
                email: email,
                telefone: document.getElementById('telefone').value.replace(/\D/g, ''),
                servico: selectServico.value,
                data: dataSel,
                hora: horaSel,
                valor: valor,
                sinal: sinal,
                observacao: document.getElementById('observacao').value.trim(),
                status: 'Pendente'
            };

            agendamentos.push(novo);
            salvarAgendamentos(agendamentos);
            localStorage.setItem('clienteLogado', JSON.stringify({ nome: nome, email: email }));

            ultimoIdAgendado = novo.id;
            modalValorSinal.textContent = formatarMoeda(sinal);
            modalPix.style.display = 'flex';

            formAgendamento.reset();
            inputValor.value = 0;
            displayValorTotal.textContent = 'R$ 0,00';
            displayValorSinal.textContent = 'R$ 0,00';
            verificarSessaoCliente();
        };

        document.getElementById('btn-copiar-pix').onclick = () => {
            const pix = document.getElementById('pix-codigo');
            pix.select();
            navigator.clipboard.writeText(pix.value);
            alert('Código Pix copiado!');
        };

        document.getElementById('btn-confirmar-pix').onclick = () => {
            if (ultimoIdAgendado) {
                const lista = obterAgendamentos().map(i => i.id === ultimoIdAgendado ? { ...i, status: 'Confirmado (Pix)' } : i);
                salvarAgendamentos(lista);
            }
            modalPix.style.display = 'none';
            verificarSessaoCliente();
            alert('Agendamento confirmado com sucesso!');
        };

        document.getElementById('btn-fechar-modal').onclick = () => {
            modalPix.style.display = 'none';
            verificarSessaoCliente();
            alert('Pré-agendamento realizado!');
        };
    }

    function iniciarAreaAdmin() {
        const telaLogin = document.getElementById('tela-login-admin');
        const conteudoAdmin = document.getElementById('conteudo-admin');
        const tabela = document.getElementById('tabela-corpo');
        const busca = document.getElementById('busca-cliente');
        const filtro = document.getElementById('filtro-status');
        const vazio = document.getElementById('mensagem-vazia');

        if (sessionStorage.getItem('adminAutenticado') === 'true') liberarAdmin();

        formLoginAdmin.onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value.trim().toLowerCase();
            const senha = document.getElementById('admin-senha').value;

            if (email === 'admin@studio.com' && senha === '123456') {
                sessionStorage.setItem('adminAutenticado', 'true');
                liberarAdmin();
            } else {
                alert('E-mail ou senha incorretos!');
            }
        };

        document.getElementById('btn-logout-admin').onclick = () => {
            sessionStorage.removeItem('adminAutenticado');
            window.location.reload();
        };

        function liberarAdmin() {
            telaLogin.style.display = 'none';
            conteudoAdmin.style.display = 'block';
            atualizarPainelAdmin();
        }

        busca.oninput = renderizarTabelaAdmin;
        filtro.onchange = renderizarTabelaAdmin;

        function atualizarPainelAdmin() {
            const lista = obterAgendamentos();
            const pendentes = lista.filter(a => a.status === 'Pendente').length;
            const totalFat = lista.reduce((acc, i) => acc + Number(i.valor || 0), 0);
            const sinalOk = lista.filter(a => a.status !== 'Pendente').reduce((acc, i) => acc + Number(i.sinal || 0), 0);

            document.getElementById('stat-total').textContent = lista.length;
            document.getElementById('stat-pendentes').textContent = pendentes;
            document.getElementById('stat-sinal').textContent = formatarMoeda(sinalOk);
            document.getElementById('stat-faturamento').textContent = formatarMoeda(totalFat);
            renderizarTabelaAdmin();
        }

        function renderizarTabelaAdmin() {
            tabela.innerHTML = '';
            const lista = obterAgendamentos().sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
            const filtrados = lista.filter(i => {
                const okNome = i.cliente.toLowerCase().includes(busca.value.toLowerCase());
                const okStatus = filtro.value === 'Todos' || i.status === filtro.value;
                return okNome && okStatus;
            });

            vazio.style.display = filtrados.length === 0 ? 'block' : 'none';

            filtrados.forEach(item => {
                let badge = 'badge-warning';
                if (item.status === 'Confirmado (Pix)') badge = 'badge-info';
                if (item.status === 'Concluído') badge = 'badge-success';

                const tr = document.createElement('tr');
                tr.innerHTML =
                    '<td><strong>' + formatarDataBR(item.data) + '</strong><br><small>às ' + item.hora + '</small></td>' +
                    '<td><strong>' + item.cliente + '</strong><br><small>' + (item.telefone || '') + '</small></td>' +
                    '<td>' + item.servico + (item.observacao ? '<br><small>Obs: ' + item.observacao + '</small>' : '') + '</td>' +
                    '<td><strong>' + formatarMoeda(item.valor) + '</strong><br><small>Sinal: ' + formatarMoeda(item.sinal) + '</small></td>' +
                    '<td><span class="badge ' + badge + '">' + item.status + '</span></td>' +
                    '<td><div class="action-buttons">' +
                    '<button class="btn-icon btn-done">✓</button>' +
                    '<button class="btn-icon btn-del">✕</button></div></td>';

                tr.querySelector('.btn-done').onclick = () => {
                    salvarAgendamentos(obterAgendamentos().map(a => a.id === item.id ? { ...a, status: 'Concluído' } : a));
                    atualizarPainelAdmin();
                };

                tr.querySelector('.btn-del').onclick = () => {
                    if (confirm('Excluir agendamento de ' + item.cliente + '?')) {
                        salvarAgendamentos(obterAgendamentos().filter(a => a.id !== item.id));
                        atualizarPainelAdmin();
                    }
                };

                tabela.appendChild(tr);
            });
        }
    }
});
