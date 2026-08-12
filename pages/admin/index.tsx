export default function Admin(){
  return (
    <div className="pt-24 max-w-4xl mx-auto px-4">
      <h1 className="text-2xl font-bold mt-8">Admin Dashboard (Demo)</h1>
      <p className="mt-4 text-shilaSilver">This is a simple admin placeholder. For this demo the product data lives in <code>data/products.json</code>. Implemented admin features will include CRUD and CSV import. For now you can edit the JSON file directly.</p>

      <div className="mt-6 card p-4 rounded">
        <h3 className="font-semibold">Demo Credentials</h3>
        <div className="text-sm text-shilaSilver mt-2">Username: <strong>admin@shilatech.local</strong><br/>Password: <strong>ChangeMe123!</strong></div>
      </div>
    </div>
  )
}
