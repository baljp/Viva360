# Catálogo de Contrato de Features (clientOnly vs persistidas)

Gerado em: 2026-02-23T22:02:39.546Z

Flows totais: 39
Client-only: 8
Persistidos validados: 4
Mistos/parciais: 27
Não classificados: 0

| Flow ID | Perfil | Tipo de contrato | ClientOnly | Final esperado | Endpoints | Persistência (P0/P1/P2) |
|---|---|---|---|---|---|---|
| buscador_ritual_diario | BUSCADOR | MISTO_OU_PARCIAL | Não | HISTORY | /api/metamorphosis/checkin, /api/users/checkin | 0/36/5 |
| buscador_metamorfose_karma_timelapse | BUSCADOR | MISTO_OU_PARCIAL | Não | TIME_LAPSE_EXPERIENCE | /api/metamorphosis/evolution, /api/oracle/history | 0/31/5 |
| buscador_busca_agenda_confirmacao | BUSCADOR | MISTO_OU_PARCIAL | Não | PAYMENT_SUCCESS | /api/appointments/*, /api/checkout/pay, /api/notifications/* | 0/7/7 |
| buscador_marketplace_checkout | BUSCADOR | MISTO_OU_PARCIAL | Não | PAYMENT_HISTORY | /api/marketplace/products, /api/checkout/pay | 0/2/9 |
| buscador_tribo_convite | BUSCADOR | PERSISTIDO_VALIDADO | Não | CHAT_ROOM | /api/tribe/*, /api/chat/* | 0/0/13 |
| buscador_retiro_offline | BUSCADOR | MISTO_OU_PARCIAL | Não | TRIBE_DASH | /api/tribe/sync, /api/notifications/* | 0/1/7 |
| buscador_pacto_de_alma | BUSCADOR | MISTO_OU_PARCIAL | Não | TRIBE_DASH | /api/invites/create, /api/tribe/* | 0/1/7 |
| buscador_circulo_de_cura_checkout | BUSCADOR | MISTO_OU_PARCIAL | Não | PAYMENT_SUCCESS | /api/calendar, /api/checkout/pay | 0/1/14 |
| buscador_missoes_diarias | BUSCADOR | CLIENT_ONLY | Sim | KARMA_WALLET | — | 0/14/11 |
| buscador_grimorio_colecao | BUSCADOR | CLIENT_ONLY | Sim | DASHBOARD | — | 0/14/15 |
| buscador_oraculo_completo | BUSCADOR | MISTO_OU_PARCIAL | Não | ORACLE_HISTORY | /api/oracle/* | 0/14/13 |
| buscador_jornada_analitica_e_journal | BUSCADOR | MISTO_OU_PARCIAL | Não | CLIENT_JOURNAL | /api/metamorphosis/*, /api/oracle/history | 0/49/7 |
| buscador_chat_social | BUSCADOR | MISTO_OU_PARCIAL | Não | CHAT_ROOM | /api/chat/*, /api/tribe/* | 0/14/19 |
| buscador_metamorfose_ritual_retorno | BUSCADOR | MISTO_OU_PARCIAL | Não | DASHBOARD | /api/metamorphosis/* | 0/19/4 |
| buscador_shell_e_config | BUSCADOR | CLIENT_ONLY | Sim | SETTINGS | — | 0/14/21 |
| guardiao_escambo | GUARDIAO | PERSISTIDO_VALIDADO | Não | ESCAMBO_CONFIRM | /api/alchemy/offers/*, /api/chat/* | 0/0/8 |
| guardiao_prontuario_consentido | GUARDIAO | PERSISTIDO_VALIDADO | Não | PATIENT_RECORDS | /api/records/* | 0/0/6 |
| guardiao_intervencao_clinica | GUARDIAO | MISTO_OU_PARCIAL | Não | DASHBOARD | /api/clinical/interventions | 0/7/6 |
| guardiao_alquimia_criar_oferta | GUARDIAO | MISTO_OU_PARCIAL | Não | ESCAMBO_MARKET | /api/marketplace/products | 0/6/12 |
| guardiao_agenda_video | GUARDIAO | MISTO_OU_PARCIAL | Não | VIDEO_SESSION | /api/appointments/* | 0/24/12 |
| guardiao_financeiro_expandido | GUARDIAO | MISTO_OU_PARCIAL | Não | FINANCIAL_DASHBOARD | /api/finance/* | 0/10/6 |
| guardiao_tribo_chat | GUARDIAO | MISTO_OU_PARCIAL | Não | CHAT_ROOM | /api/chat/*, /api/tribe/* | 0/6/18 |
| guardiao_vagas_completas | GUARDIAO | MISTO_OU_PARCIAL | Não | VAGA_APPLY | /api/recruitment/* | 0/6/12 |
| guardiao_santuarios_parceria | GUARDIAO | MISTO_OU_PARCIAL | Não | SANTUARIO_CONTRACT | /api/spaces/* | 0/12/6 |
| guardiao_paciente_plano_e_trade | GUARDIAO | PERSISTIDO_VALIDADO | Não | ESCAMBO_CONFIRM | /api/alchemy/*, /api/records/* | 0/0/11 |
| guardiao_shell_e_config | GUARDIAO | CLIENT_ONLY | Sim | SETTINGS | — | 0/12/14 |
| santuario_vagas_entrevista | SANTUARIO | MISTO_OU_PARCIAL | Não | VAGA_CANDIDATES | /api/recruitment/* | 3/12/7 |
| santuario_operacao_completa | SANTUARIO | MISTO_OU_PARCIAL | Não | FINANCE_OVERVIEW | /api/spaces/*, /api/rooms/*, /api/finance/* | 5/25/3 |
| santuario_inteligencia_preditiva | SANTUARIO | CLIENT_ONLY | Sim | ROOM_AGENDA | — | 3/14/5 |
| santuario_auditoria_interna | SANTUARIO | CLIENT_ONLY | Sim | GOVERNANCE | — | 3/12/8 |
| santuario_pacientes_operacao | SANTUARIO | MISTO_OU_PARCIAL | Não | PATIENT_RECORDS | /api/records/*, /api/appointments/* | 3/24/13 |
| santuario_time_e_avaliacao_servico | SANTUARIO | MISTO_OU_PARCIAL | Não | SERVICE_EVALUATION | /api/spaces/*, /api/reviews/* | 3/27/3 |
| santuario_salaseestrutura_expandida | SANTUARIO | MISTO_OU_PARCIAL | Não | ROOM_EDIT | /api/rooms/* | 6/23/3 |
| santuario_financeiro_expandido | SANTUARIO | MISTO_OU_PARCIAL | Não | FINANCE_FORECAST | /api/finance/* | 3/17/3 |
| santuario_marketplace_eventos_retiros | SANTUARIO | MISTO_OU_PARCIAL | Não | RETREATS_MANAGE | /api/marketplace/*, /api/events/* | 5/19/3 |
| santuario_recrutamento_completo | SANTUARIO | MISTO_OU_PARCIAL | Não | VAGA_CANDIDATES | /api/recruitment/* | 3/12/8 |
| santuario_analytics_reputacao_chat | SANTUARIO | MISTO_OU_PARCIAL | Não | CHAT_ROOM | /api/chat/*, /api/analytics/* | 3/14/6 |
| santuario_shell_e_encerramento | SANTUARIO | CLIENT_ONLY | Sim | EXEC_DASHBOARD | — | 3/23/7 |
| santuario_avaliacao_servico | SANTUARIO | CLIENT_ONLY | Sim | EXEC_DASHBOARD | — | 3/16/3 |
