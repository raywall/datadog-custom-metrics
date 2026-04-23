.PHONY: start stop

# Inicia o simulador de métricas customizadas para datadog
start:
	@echo ""
	@echo "  Iniciando Simulador em http://localhost:4200"
	@echo ""
	@python3 -m http.server 4200 --directory ./app

# Encerra qualquer processo nas portas utilizadas
stop:
	@echo "  Encerrando processos nas portas 4200..."
	@-lsof -ti tcp:4200 | xargs kill 2>/dev/null || true