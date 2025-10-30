import type { Transaction, InstallmentInfo } from '~/types/transaction'

/**
 * Composable for installment-related utilities
 * Installment processing is now done server-side by default
 * These functions are kept for client-side re-processing if needed
 */
export const useInstallments = () => {
  /**
   * Parseia a descrição da transação para extrair informações da parcela
   * Formato esperado: "Descrição X/Y" ou "Descrição X/Y outras palavras"
   * Exemplos: "Netflix 01/12", "Compra Cartão 03/10 - Item"
   */
  const parseInstallment = (description: string): InstallmentInfo | null => {
    // Regex para capturar padrão "X/Y" em qualquer posição da descrição
    const regex = /(\d{2})\/(\d{2})/
    const match = description.match(regex)

    if (!match) {
      return null
    }

    const current = parseInt(match[1])
    const total = parseInt(match[2])

    // Extrair descrição base (texto antes do padrão X/Y)
    const descriptionBase = description.substring(0, match.index).trim()

    return {
      description: descriptionBase,
      current,
      total
    }
  }

  /**
   * Verifica se a transação é do tipo parcela/financiamento
   * Filtra apenas por categoria "Installments/Financing"
   */
  const isInstallmentTransaction = (transaction: Transaction): boolean => {
    const destination = transaction.destination?.toLowerCase() || ''
    return destination.includes('installments/financing') ||
           destination.includes('installments') && destination.includes('financing')
  }

  /**
   * Verifica se a transação é a primeira parcela (01/XX)
   */
  const isFirstInstallment = (transaction: Transaction): boolean => {
    const installmentInfo = parseInstallment(transaction.description)
    return installmentInfo !== null && installmentInfo.current === 1
  }

  /**
   * Cria chave única para agrupar parcelas relacionadas
   * Baseado na descrição base + valor + origem
   */
  const createInstallmentGroupKey = (
    transaction: Transaction,
    installmentInfo: InstallmentInfo
  ): string => {
    // Normalizar valor com 2 casas decimais
    const normalizedAmount = Math.abs(transaction.amount).toFixed(2)
    return `${installmentInfo.description.toLowerCase()}_${transaction.origin}`
  }

  /**
   * Gera todas as parcelas mensais a partir da primeira parcela
   * Data base: dia da primeira parcela, demais parcelas no dia 01 de cada mês
   */
  const generateMonthlyInstallments = (
    firstInstallment: Transaction,
    installmentInfo: InstallmentInfo
  ): Transaction[] => {
    const { total, description } = installmentInfo
    const transactions: Transaction[] = []

    // Data da primeira parcela (mantém o dia original)
    const firstDate = new Date(firstInstallment.date)

    // Segunda parcela em diante: dia 01 do próximo mês
    let nextMonth = new Date(firstDate)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    nextMonth.setDate(2)

    // Gerar todas as parcelas de 01/XX até XX/XX
    for (let i = 1; i <= total; i++) {
      let installmentDate: Date

      if (i === 1) {
        // Primeira parcela: mantém a data original
        installmentDate = new Date(firstDate)
      } else {
        // Demais parcelas: dia 01 do mês
        installmentDate = new Date(nextMonth)
        installmentDate.setMonth(nextMonth.getMonth() + (i - 2))
      }

      const dateISO = installmentDate.toISOString().split('T')[0]

      transactions.push({
        ...firstInstallment,
        transactionId: `${firstInstallment.transactionId}_${i}_${total}`,
        date: dateISO,
        description: `${description} ${String(i).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
        amount: firstInstallment.amount, // Mantém o valor original da parcela
      })
    }

    return transactions
  }

  /**
   * Processa todas as transações de parcelas/financiamentos
   *
   * FLUXO:
   * 1. Filtra transações com destination = "Installments/Financing"
   * 2. Identifica primeiras parcelas (01/XX)
   * 3. Agrupa parcelas relacionadas por descrição base + valor + origem
   * 4. Remove parcelas duplicadas do mesmo grupo
   * 5. Gera novas transações com datas corretas (dia 01 de cada mês)
   *
   * @param transactions - Lista de transações originais
   * @returns Lista de transações processadas
   */
  const processInstallments = (transactions: Transaction[]): Transaction[] => {
    const processed: Transaction[] = []
    const installmentGroups = new Map<string, Transaction[]>()
    const processedGroupKeys = new Set<string>()

    // Debug: Logs iniciais
    console.log('🔍 [Installments] Total de transações recebidas:', transactions.length)
    const installmentTransactions = transactions.filter(t => isInstallmentTransaction(t))
    console.log('🔍 [Installments] Transações de parcelas/financiamentos:', installmentTransactions.length)

    // PASSO 1 e 2: Separar transações e identificar parcelas
    for (const transaction of transactions) {
      // Se não é parcela/financiamento, adiciona direto
      if (!isInstallmentTransaction(transaction)) {
        processed.push(transaction)
        continue
      }

      console.log('📝 [Installments] Processando transação:', {
        id: transaction.transactionId,
        description: transaction.description,
        destination: transaction.destination
      })

      // Tentar parsear informações da parcela
      const installmentInfo = parseInstallment(transaction.description)
      console.log('🔍 [Installments] Parse result:', {
        description: transaction.description,
        parsedInfo: installmentInfo
      })

      if (!installmentInfo) {
        // Não conseguiu parsear padrão X/Y, adiciona normalmente
        console.log('❌ [Installments] Não conseguiu parsear, adicionando normalmente')
        processed.push(transaction)
        continue
      }

      // PASSO 3: Criar chave do grupo (descrição + valor + origem)
      const groupKey = createInstallmentGroupKey(transaction, installmentInfo)
      console.log('🔑 [Installments] Chave do grupo criada:', groupKey)

      // Adicionar ao grupo
      if (!installmentGroups.has(groupKey)) {
        installmentGroups.set(groupKey, [])
        console.log('➕ [Installments] Novo grupo criado:', groupKey)
      }
      installmentGroups.get(groupKey)!.push(transaction)
      console.log('📋 [Installments] Transação adicionada ao grupo. Total no grupo:', installmentGroups.get(groupKey)!.length)
    }

    // Debug: Verificar se há grupos de parcelas identificados
    console.log('🔍 [Installments] Número de grupos identificados:', installmentGroups.size)
    console.log('🔍 [Installments] Chaves dos grupos:', Array.from(installmentGroups.keys()))
    
    // Converter Map para objeto para visualização
    const groupsObject = Object.fromEntries(
      Array.from(installmentGroups.entries()).map(([key, transactions]) => [
        key,
        transactions.map(t => ({
          id: t.transactionId,
          date: t.date,
          description: t.description,
          amount: t.amount,
          origin: t.origin,
          destination: t.destination
        }))
      ])
    )
    console.log('🔍 [Installments] Grupos de parcelas identificados:', JSON.stringify(groupsObject, null, 2))

    // PASSO 4 e 5: Processar cada grupo de parcelas
    for (const [groupKey, installments] of installmentGroups) {
      if (processedGroupKeys.has(groupKey)) continue

      try {
        // Encontrar a primeira parcela (01/XX)
        const firstInstallment = installments.find(t => isFirstInstallment(t))

        if (!firstInstallment) {
          // Se não encontrou a primeira parcela, adiciona todas as parcelas originais
          processed.push(...installments)
          processedGroupKeys.add(groupKey)
          continue
        }

        const installmentInfo = parseInstallment(firstInstallment.description)!

        // Gerar todas as parcelas com datas corretas
        const generatedInstallments = generateMonthlyInstallments(
          firstInstallment,
          installmentInfo
        )

        processed.push(...generatedInstallments)
        processedGroupKeys.add(groupKey)
      } catch (error) {
        // Em caso de erro, adiciona as transações originais
        processed.push(...installments)
        processedGroupKeys.add(groupKey)
      }
    }

    return processed
  }

  return {
    parseInstallment,
    isInstallmentTransaction,
    isFirstInstallment,
    processInstallments,
  }
}
