
import { supabase } from '@/integrations/supabase/client';
import { TransactionStatus, TransactionType } from '@/lib/types';

export const generateDemoData = async () => {
  try {
    // Obtener la organización del usuario actual
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Usuario no autenticado');

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error('No se encontró la organización del usuario');
    }

    const orgId = profile.organization_id;

    // Crear cardholders de demo
    const demoCardholders = [
      {
        full_name: 'Juan Pérez García',
        email: 'juan.perez@email.com',
        phone: '+52 555 123 4567',
        country: 'MX',
        address: 'Av. Reforma 123, CDMX, México',
        card_token: 'tok_demo_visa_4532',
        card_brand: 'visa',
        pan_first6: '453265',
        pan_last4: '1234'
      },
      {
        full_name: 'María López Hernández',
        email: 'maria.lopez@email.com',
        phone: '+52 555 987 6543',
        country: 'MX',
        address: 'Calle Juárez 456, Guadalajara, México',
        card_token: 'tok_demo_mastercard_5555',
        card_brand: 'mastercard',
        pan_first6: '555544',
        pan_last4: '5678'
      },
      {
        full_name: 'Carlos Rodríguez Sánchez',
        email: 'carlos.rodriguez@email.com',
        phone: '+1 555 246 8135',
        country: 'US',
        address: '789 Main St, Los Angeles, CA, USA',
        card_token: 'tok_demo_visa_4111',
        card_brand: 'visa',
        pan_first6: '411111',
        pan_last4: '9999'
      }
    ];

    const { data: cardholders, error: cardholdersError } = await supabase
      .from('cardholders')
      .insert(demoCardholders)
      .select();

    if (cardholdersError) throw cardholdersError;

    // Crear instancia de demo si no existe
    const { data: existingInstance } = await supabase
      .from('instances')
      .select('id')
      .eq('organization_id', orgId)
      .limit(1)
      .single();

    let instanceId;
    if (!existingInstance) {
      const { data: newInstance, error: instanceError } = await supabase
        .from('instances')
        .insert([{
          legal_name: 'Empresa Demo SA de CV',
          registration_id: 'RFC123456789',
          country_iso: 'MX',
          settlement_currency: 'USD',
          organization_id: orgId,
          status: 'active'
        }])
        .select()
        .single();

      if (instanceError) throw instanceError;
      instanceId = newInstance.id;
    } else {
      instanceId = existingInstance.id;
    }

    // Obtener el wallet de instancia para crear transacciones
    const { data: instanceWallet } = await supabase
      .from('instance_wallets')
      .select('id')
      .eq('instance_id', instanceId)
      .single();

    if (instanceWallet && cardholders) {
      // Crear transacciones de demo
      const demoTransactions = [
        {
          instance_id: instanceId,
          cardholder_id: cardholders[0].id,
          instance_wallet_id: instanceWallet.id,
          type: 'pay_out' as TransactionType,
          rail: 'visa_direct',
          amount_brutto: 150.00,
          commission: 3.50,
          tax: 0.00,
          amount_net: 146.50,
          status: 'completed' as TransactionStatus,
          external_reference: 'TXN-DEMO-001'
        },
        {
          instance_id: instanceId,
          cardholder_id: cardholders[1].id,
          instance_wallet_id: instanceWallet.id,
          type: 'pay_out' as TransactionType,
          rail: 'mastercard_send',
          amount_brutto: 250.00,
          commission: 5.25,
          tax: 12.50,
          amount_net: 232.25,
          status: 'pending' as TransactionStatus,
          external_reference: 'TXN-DEMO-002'
        },
        {
          instance_id: instanceId,
          cardholder_id: cardholders[2].id,
          instance_wallet_id: instanceWallet.id,
          type: 'pay_out' as TransactionType,
          rail: 'visa_direct',
          amount_brutto: 75.00,
          commission: 1.75,
          tax: 3.75,
          amount_net: 69.50,
          status: 'failed' as TransactionStatus,
          external_reference: 'TXN-DEMO-003'
        }
      ];

      const { error: transactionsError } = await supabase
        .from('transactions')
        .insert(demoTransactions);

      if (transactionsError) throw transactionsError;
    }

    // Agregar fondos al wallet organizacional para demo
    const { data: orgWallet } = await supabase
      .from('org_wallets')
      .select('id')
      .eq('organization_id', orgId)
      .eq('currency', 'USD')
      .single();

    if (orgWallet) {
      await supabase.rpc('create_deposit', {
        p_org_wallet_id: orgWallet.id,
        p_amount: 5000.00,
        p_reference: 'Depósito inicial de demo'
      });
    }

    return {
      cardholders: cardholders.length,
      transactions: 3,
      instance: instanceId ? 1 : 0
    };

  } catch (error) {
    console.error('Error generando datos demo:', error);
    throw error;
  }
};
