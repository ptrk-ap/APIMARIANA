const testApi = async () => {
  const BASE_URL = 'http://localhost:3001';
  console.log('1. Testando Login (/auth)...');
  
  let token = '';
  try {
    const res = await fetch(`${BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'testuser', senha: 'testpassword' })
    });
    const data = await res.json();
    console.log('Status Login:', res.status);
    // console.log('Resposta Login:', data);
    token = data.token;
  } catch (err) {
    console.error('Erro no login:', err);
  }

  if (token) {
    console.log('\n2. Testando rota protegida (/consultar) com a frase especificada...');
    try {
      const res = await fetch(`${BASE_URL}/consultar`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ frase: 'despesas pagas na seplan' })
      });
      const data = await res.json();
      console.log('Status /consultar:', res.status);
      console.log('Resposta /consultar:', data);
    } catch (err) {
      console.error('Erro na consulta:', err);
    }
  }
};

testApi();
