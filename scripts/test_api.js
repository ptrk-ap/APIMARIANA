const testApi = async () => {
  const BASE_URL = 'http://localhost:3001';
  console.log('1. Testando Login (/auth)...');
  
  let token = '';
  try {
    const res = await fetch(`${BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'admin', senha: 'senha123' })
    });
    const data = await res.json();
    console.log('Status Login:', res.status);
    console.log('Resposta Login:', data);
    token = data.token;
  } catch (err) {
    console.error('Erro no login:', err);
  }

  if (token) {
    console.log('\n2. Testando rota protegida (/consultar) COM token...');
    try {
      const res = await fetch(`${BASE_URL}/consultar`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Status /consultar:', res.status);
      console.log('Resposta /consultar:', data);
    } catch (err) {
      console.error('Erro na consulta:', err);
    }
  }

  console.log('\n3. Testando rota protegida (/consultar) SEM token...');
  try {
    const res = await fetch(`${BASE_URL}/consultar`);
    const data = await res.json();
    console.log('Status /consultar (sem token):', res.status);
    console.log('Resposta /consultar (sem token):', data);
  } catch (err) {
    console.error('Erro na consulta sem token:', err);
  }
};

testApi();
