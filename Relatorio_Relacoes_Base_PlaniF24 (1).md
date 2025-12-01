# Parecer didático sobre as relações entre abas — Base PlaniF 24

Este documento traduz as **fórmulas** e **listas suspensas** da planilha para uma visão simples de como as abas conversam entre si.

**Termos em linguagem simples**:

- *Aba*: é cada 'página' da planilha (ex.: Captar, Modelo).

- *Lista suspensa*: menu de opções que aparece em uma célula para evitar digitar nomes diferentes para a mesma coisa.

- *Referência*: quando uma célula puxa dados de outra aba (ex.: `=SOMA('Jan'!B2:B50)`).


---

## Visão geral (quem alimenta quem)

- **Abr →** Captar, Dez, Modelo
- **Ago →** Captar, Dez, Modelo
- **Analisar →** Captar, Modelo
- **Captar →** Modelo
- **Dez →** Captar, Modelo
- **Fev →** Captar, Dez, Modelo
- **Jan →** Captar, Modelo
- **Jul →** Captar, Dez, Modelo
- **Jun →** Captar, Dez, Modelo
- **Mai →** Captar, Dez, Modelo
- **Mar →** Abr, Captar, Dez
- **Modelo →** Captar
- **Nov →** Captar, Dez, Modelo
- **Out →** Captar, Dez, Modelo
- **Panorama →** Abr, Ago, Dez, Fev, Jan, Jul, Jun, Mai, Mar, Nov, Out, REF, Set
- **Set →** Captar, Dez, Modelo

> Interpretação: cada seta significa que a aba da esquerda **puxa** informações da aba da direita (por fórmula) ou usa suas listas (validação de dados).


---
## Explicação por aba

### Modelo

- **Puxa dados de:** Captar

- **É usada por:** Abr, Ago, Analisar, Captar, Dez, Fev, Jan, Jul, Jun, Mai, Nov, Out, Set

- **Exemplos de fórmulas/validações**:
  - Ex.: Modelo → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2



### Jan

- **Puxa dados de:** Captar, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Jan → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Jan → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Fev

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Fev → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Fev → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21
  - Ex.: Fev → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Mar

- **Puxa dados de:** Abr, Captar, Dez

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Mar → Abr :: ="Total "&Abr!$J$27 | ="Total "&Abr!$J$40 | ="Total "&Abr!$J$50
  - Ex.: Mar → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Mar → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21



### Abr

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Mar, Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Abr → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Abr → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21
  - Ex.: Abr → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Mai

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Mai → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Mai → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21
  - Ex.: Mai → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Jun

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Jun → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Jun → Dez :: =Dez!$K$21 | =Dez!$U$12 | =Dez!$U$16
  - Ex.: Jun → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Jul

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Jul → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Jul → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21
  - Ex.: Jul → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Ago

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Ago → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Ago → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21
  - Ex.: Ago → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Captar

- **Puxa dados de:** Modelo

- **É usada por:** Abr, Ago, Analisar, Dez, Fev, Jan, Jul, Jun, Mai, Mar, Modelo, Nov, Out, Set

- **Exemplos de fórmulas/validações**:
  - Ex.: Captar → Modelo :: [DV] =Modelo!$B$96:$B$119 | [DV] =Modelo!$B$122:$B$177 | [DV] =Modelo!$B$180:$B$194

- **Listas suspensas:** usa opções vindas de: Modelo



### Analisar

- **Puxa dados de:** Captar, Modelo

- **Exemplos de fórmulas/validações**:
  - Ex.: Analisar → Captar :: =SUMIFS(Captar!L:L,Captar!T:T,A4,Captar!J:J,"<>0",Captar!K:K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,A4,Captar!$W:$W,$I$2,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,A4,Captar!$W:$W
  - Ex.: Analisar → Modelo :: [DV] =Modelo!$B$122:$B$177 | [DV] =Modelo!$C$122:$C$132

- **Listas suspensas:** usa opções vindas de: Modelo



### Set

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Set → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Set → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21
  - Ex.: Set → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Out

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Out → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Out → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21
  - Ex.: Out → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Nov

- **Puxa dados de:** Captar, Dez, Modelo

- **É usada por:** Panorama

- **Exemplos de fórmulas/validações**:
  - Ex.: Nov → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Nov → Dez :: =Dez!$P$19 | =Dez!$K$17 | =Dez!$K$21
  - Ex.: Nov → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Dez

- **Puxa dados de:** Captar, Modelo

- **É usada por:** Abr, Ago, Fev, Jul, Jun, Mai, Mar, Nov, Out, Panorama, Set

- **Exemplos de fórmulas/validações**:
  - Ex.: Dez → Captar :: =SUMIFS(Captar!$L:$L,Captar!$T:$T,J28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,O28,Captar!$W:$W,$C$6+1,Captar!$K:$K,"Saída") | =SUMIFS(Captar!$L:$L,Captar!$T:$T,T2
  - Ex.: Dez → Modelo :: =Modelo!B66 | =Modelo!B69 | =Modelo!B34



### Panorama

- **Puxa dados de:** Abr, Ago, Dez, Fev, Jan, Jul, Jun, Mai, Mar, Nov, Out, REF, Set

- **Exemplos de fórmulas/validações**:
  - Ex.: Panorama → Abr :: =Abr!C2 | =Abr!D2 | =Abr!C24
  - Ex.: Panorama → Ago :: =Ago!C2 | =Ago!D2 | =Ago!C24
  - Ex.: Panorama → Dez :: =Dez!C2 | =Dez!D2 | =Dez!C24



### Melhorando

- **Ligação com outras abas:** não identificamos fórmulas ou listas suspensas que cruzem com outras abas.



---
## Nomes definidos

Não foram encontrados nomes definidos relevantes além dos padrões internos do Excel.


---
## Observações e limites do diagnóstico

- Este relatório lê **fórmulas, listas suspensas e nomes definidos**. Ele pode **não** enxergar **Tabelas Dinâmicas (Pivot)**, gráficos com vínculos complexos e algumas regras de formatação condicional.

- Caso você use **linhas ocultas** ou **abas protegidas**, a leitura continua, mas alguns detalhes podem não aparecer aqui.


## Próximos passos sugeridos (em linguagem simples)

1. **Confirme o fluxo principal**: *Captar* → *Abas dos meses* → *Analisar* → *Panorama*. Se houver outras setas, me avise para incluirmos no MVP.

2. **Liste 3 fórmulas-chave** por aba (as que você mais confia para fechar o mês). Eu traduzo cada uma para regra do sistema do app.

3. **Ajuste as listas suspensas** na aba *Modelo*: quanto mais padronizado o nome das categorias, melhor os relatórios.
