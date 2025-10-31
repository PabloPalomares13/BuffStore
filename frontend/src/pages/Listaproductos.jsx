import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronRight, ChevronLeft, Edit, Trash2, Plus, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logobuff from '../assets/logobuff0033.png';

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  logog: {
    marginBottom: 20,
    width: 280,
    height: 100,
    alignSelf: 'center',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 5,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
    minHeight: 40,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
    minHeight: 40,
    backgroundColor: '#F9FAFB',
  },
  tableColCode: { width: '10%', textAlign: 'center', paddingLeft: 8 },
  tableColName: { width: '25%', textAlign: 'left', paddingLeft: 8 },
  tableColCategory: { width: '15%', textAlign: 'left', paddingLeft: 8 },
  tableColStock: { width: '10%', textAlign: 'left', paddingLeft: 8 },
  tableColStatus: { width: '15%', textAlign: 'left', paddingLeft: 8 },
  tableColPrice: { width: '15%', textAlign: 'left', paddingLeft: 8 },
  tableHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  tableCell: {
    fontSize: 10,
    color: '#4B5563',
  },
  statusInStock: {
    color: '#10B981',
    fontSize: 10,
  },
  statusLimited: {
    color: '#F59E0B',
    fontSize: 10,
  },
  statusOutOfStock: {
    color: '#EF4444',
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
    color: '#6B7280',
  },
  logo: {
    marginBottom: 20,
    width: 100,
    height: 50,
    alignSelf: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#6B7280',
  },
});


const ProductsDocument = ({ products }) => {
  
  const currentDate = new Date().toLocaleDateString('es-ES');
  
  
  const getStatusStyles = (stock) => {
    if (stock > 5) {
      return { style: styles.statusInStock, text: 'In Stock' };
    } else if (stock > 0) {
      return { style: styles.statusLimited, text: 'Limited' };
    } else {
      return { style: styles.statusOutOfStock, text: 'Out Of Stock' };
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <Image style={styles.logog} src={logobuff} alt="Logo" /> 
        <Text style={styles.header}>Lista de Productos</Text>
        <Text style={styles.subHeader}>Fecha del reporte: {currentDate}</Text>
        
        
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableColCode}>
              <Text style={styles.tableHeader}>CÓDIGO</Text>
            </View>
            <View style={styles.tableColName}>
              <Text style={styles.tableHeader}>NOMBRE</Text>
            </View>
            <View style={styles.tableColCategory}>
              <Text style={styles.tableHeader}>CATEGORÍA</Text>  
            </View>
            <View style={styles.tableColStock}>
              <Text style={styles.tableHeader}>STOCK</Text>
            </View>
            <View style={styles.tableColStatus}>
              <Text style={styles.tableHeader}>ESTADO</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableHeader}>PRECIO</Text>
            </View>
          </View>
          
          
          {products.map((product) => {
            const statusStyle = getStatusStyles(product.stock);
            
            return (
              <View key={product._id} style={styles.tableRow}>
                <View style={styles.tableColCode}>
                  <Text style={styles.tableCell}>{product.code}</Text>
                </View>
                <View style={styles.tableColName}>
                  <Text style={styles.tableCell}>{product.name}</Text>
                </View>
                <View style={styles.tableColCategory}>
                  <Text style={styles.tableCell}>{product.category}</Text>
                </View>
                <View style={styles.tableColStock}>
                  <Text style={styles.tableCell}>{product.stock}</Text>
                </View>
                <View style={styles.tableColStatus}>
                  <Text style={statusStyle.style}>{statusStyle.text}</Text>
                </View>
                <View style={styles.tableColPrice}>
                  <Text style={styles.tableCell}>${Number(product.price).toLocaleString('en-US')}</Text>
                </View>
              </View>
            );
          })}
        </View>
        
        <Text style={styles.footer}>
          © {new Date().getFullYear()} Su Empresa • Generado automáticamente
        </Text>
        
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `${pageNumber} / ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
};


const PRODUCTS_PER_PAGE = 10;

const Listaproductos = () => {
  
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  
 
  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${link}/api/products`);
      if (!response.ok) {
        throw new Error("Error al obtener los productos");
      }
      const data = await response.json();
      
      // Ahora las imágenes son URLs directas de Google Cloud Storage
      const productsWithImages = data.map(product => {
        if (product.images && product.images.length > 0) {
          return { 
            ...product, 
            displayImageUrl: product.images[0] // Usar directamente la URL de GCS
          };
        }
        return {
          ...product,
          displayImageUrl: '/path/to/placeholder.jpg' // Tu placeholder
        };
      });
      
      setProducts(productsWithImages || []);
      setPagination(prev => ({ ...prev, total: data.length || 0 }));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProducts();
  }, []);
  
 
  const getStatusStyles = (stock) => {
    if (stock > 5) {
      return { containerClass: 'bg-green-50 text-green-500', dotClass: 'text-green-500', status: 'In Stock' };
    } else if (stock > 0) {
      return { containerClass: 'bg-amber-50 text-amber-500', dotClass: 'text-amber-500', status: 'Limited' };
    } else {
      return { containerClass: 'bg-red-50 text-red-500', dotClass: 'text-red-500', status: 'Out Of Stock' };
    }
  };

  const handleChangePage = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };
  
  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    return (
      product.code.toLowerCase().includes(term) ||
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term) ||
      String(product.stock).includes(term) ||
      String(product.price).includes(term)
    );
  });
  
  const totalFiltered = filteredProducts.length;
  const totalPages = Math.ceil(totalFiltered / PRODUCTS_PER_PAGE);  

  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      totalPages: totalPages,
      currentPage: Math.min(prev.currentPage, totalPages || 1),
    }));
  }, [totalFiltered]);

  const indexOfLast = pagination.currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirst = indexOfLast - PRODUCTS_PER_PAGE;
  const currentProducts = filteredProducts.slice(indexOfFirst, indexOfLast);
  
  const handleDeleteProduct = async (id) => {
    const confirm = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el producto de forma permanente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const response = await fetch(`${link}/api/products/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Error al eliminar el producto');
        }
        Swal.fire('Eliminado', 'El producto ha sido eliminado con éxito.', 'success');
        fetchProducts();
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Lista de Productos</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="relative w-60 max-w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar producto" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          <button 
            onClick={() => setPdfReady(true)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Download size={18} />
            Exportar
          </button>
          {pdfReady && isClient && (
          <div style={{ display: 'none' }}>
            <PDFDownloadLink
              document={<ProductsDocument products={filteredProducts} />}
              fileName="productos.pdf"
              className="hidden"
            >
              {({ url }) => {
                if (url) {
                  // Abrir automáticamente la descarga
                  window.open(url);
                  setPdfReady(false);
                }
                return null;
              }}
            </PDFDownloadLink>
          </div>
        )}

          <a href='/newproduct' className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-md hover:shadow-lg transition transform hover:-translate-y-0.5">
            <Plus size={18} />
            Agregar Producto
          </a>
        </div>
      </div>
      
      {/* Products Table */}
      {loading ? (
        <p className="text-gray-600">Cargando productos...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden backdrop-filter backdrop-blur-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Imagen</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Codigo del producto</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre del producto</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="py-4 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product) => {
                  const statusStyles = getStatusStyles(product.stock);
                  return (
                    <tr key={product._id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                      <td className="py-2 px-5">
                      {product.displayImageUrl && (
                        <img src={product.displayImageUrl} alt={product.name} className="w-22 h-22 object-cover rounded-full" />  
                      )}
                      </td>
                      <td className="py-4 px-5 font-medium text-gray-800">{product.code}</td>
                      <td className="py-4 px-5 font-medium text-gray-800">{product.name}</td>
                      <td className="py-4 px-5 text-gray-700">{product.category}</td>
                      <td className="py-4 px-5 text-gray-700">{product.stock}</td>
                      <td className="py-4 px-5">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles.containerClass}`}>
                          <span className={`mr-1.5 text-lg ${statusStyles.dotClass}`}>•</span>
                          {statusStyles.status}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-medium text-gray-800">${Number(product.price).toLocaleString('en-US')}</td>  
                      <td className="py-4 px-5">
                        <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => window.location.href = `/modproducto/${product._id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition"
                        >
                          <Edit size={16} />
                        </button>
                          <button onClick={() => handleDeleteProduct(product._id)} className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition">
                            <Trash2 size={16} /> 
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="px-4 py-3 flex items-center justify-between border-t ">
        <div className="flex-1 flex justify-between sm:hidden ">
          <button
            onClick={() => handleChangePage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
              pagination.currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => handleChangePage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              pagination.currentPage === pagination.totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando{" "}
              <span className="font-medium">{pagination.currentPage}</span> de{" "}
              <span className="font-medium">{pagination.totalPages}</span> productos
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px " aria-label="Pagination">
              <button
                onClick={() => handleChangePage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium  ${
                  pagination.currentPage === 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft size={16} />
              </button>

              {[...Array(pagination.totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => handleChangePage(page + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pagination.currentPage === page + 1
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page + 1}
                </button>
              ))}

              <button
                onClick={() => handleChangePage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  pagination.currentPage === pagination.totalPages 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Next</span>
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Listaproductos;