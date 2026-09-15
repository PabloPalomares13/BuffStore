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
      const token = localStorage.getItem('userToken');
      try {
        const response = await fetch(`${link}/api/products/${id}`, {
          method: 'DELETE',
          headers: {
        'Authorization': `Bearer ${token}` // ✅ Enviamos el token aquí
        },
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
    <div className="relative bg-[#232323]/40 backdrop-blur-md rounded-[20px] shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] shadow-[#000000]/70 p-6 overflow-hidden"
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
      {/* Manchas de luz neón difuminadas */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />
 
      <div className="relative flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="font-haze uppercase text-2xl tracking-wide text-white pl-1">
          Lista de <span className="text-[#00FF37]">Productos</span>
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="relative w-60 max-w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={18} />
            <input
              type="text"
              placeholder="Buscar producto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-Urbanist text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
            />
          </div>
          <button
            onClick={() => setPdfReady(true)}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-Urbanist text-white/80 hover:bg-white/20 hover:scale-105 transform transition-colors duration-200 flex items-center gap-2"
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
 
          <a
            href='/newproduct'
            className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-md border border-[#00FF37]/40 rounded-full text-sm font-Urbanist text-white shadow-[0_0_12px_-2px_#00FF37] hover:scale-105 transform transition-colors duration-200"
          >
            <Plus size={18} />
            Agregar Producto
          </a>
        </div>
      </div>
 
      {/* Products Table */}
      {loading ? (
        <p className="relative text-white/60 font-Urbanist">Cargando productos...</p>
      ) : error ? (
        <p className="relative text-[#FF137A] font-Urbanist">{error}</p>
      ) : (
        <div className="relative bg-black/40 rounded-[20px] border border-white/20 overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="sm:text-center md:text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Imagen</th>
                  <th className="text-center py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Codigo del producto</th>
                  <th className="text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Nombre del producto</th>
                  <th className="text-center py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Categoría</th>
                  <th className="text-center py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Stock</th>
                  <th className="sm:text-center md:text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Estado</th>
                  <th className="sm:text-center md:text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Precio</th>
                  <th className="py-4 px-5"></th>
                </tr>
              </thead>
              <tbody>
                {currentProducts.map((product) => {
                  const statusStyles = getStatusStyles(product.stock);
                  return (
                    <tr key={product._id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-5">
                      {product.displayImageUrl && (
                        <img src={product.displayImageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-full border border-white/20" />
                      )}
                      </td>
                      <td className="py-4 px-5 font-Urbanist font-medium text-center text-white/80">{product.code}</td>
                      <td className="py-4 px-5 font-Urbanist font-medium text-white">{product.name}</td>
                      <td className="py-4 px-5 font-Urbanist text-center text-white/70">{product.category}</td>
                      <td className="py-4 px-5 font-Urbanist text-center text-white/70">{product.stock}</td>
                      <td className="py-4 px-5">
                        <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-Urbanist font-medium border ${statusStyles.containerClass}`}>
                          <span className={`mr-1.5 text-lg ${statusStyles.dotClass}`}>•</span>
                          {statusStyles.status}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-Urbanist font-medium text-white">${Number(product.price).toLocaleString('en-US')}</td>
                      <td className="py-4 px-5">
                        <div className="flex justify-end gap-2">
                        <button
                          onClick={() => window.location.href = `/modproducto/${product._id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/60 hover:border-[#00FF37]/50 hover:text-[#00FF37] hover:bg-[#00FF37]/10 hover:scale-105 transform transition-colors duration-200"
                        >
                          <Edit size={16} />
                        </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/60 hover:border-[#FF137A]/50 hover:text-[#FF137A] hover:bg-[#FF137A]/10 hover:scale-105 transform transition-colors duration-200"
                          >
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
 
      <div className="relative px-4 py-3 flex items-center justify-between border-t border-white/10 mt-2">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handleChangePage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 rounded-full text-sm font-Urbanist font-medium border transition-colors ${
              pagination.currentPage === 1
                ? 'border-white/10 text-white/20 cursor-not-allowed'
                : 'border-white/20 text-white/70 hover:bg-white/10'
            }`}
          >
            Previous
          </button>
          <button
            onClick={() => handleChangePage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 rounded-full text-sm font-Urbanist font-medium border transition-colors ${
              pagination.currentPage === pagination.totalPages
                ? 'border-white/10 text-white/20 cursor-not-allowed'
                : 'border-white/20 text-white/70 hover:bg-white/10'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-Urbanist text-white/60">
              Mostrando{" "}
              <span className="font-medium text-white/90">{pagination.currentPage}</span> de{" "}
              <span className="font-medium text-white/90">{pagination.totalPages}</span> productos
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex items-center gap-1.5" aria-label="Pagination">
              <button
                onClick={() => handleChangePage(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors ${
                  pagination.currentPage === 1
                    ? 'border-white/10 text-white/20 cursor-not-allowed'
                    : 'border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft size={16} />
              </button>
 
              {[...Array(pagination.totalPages).keys()].map((page) => (
                <button
                  key={page + 1}
                  onClick={() => handleChangePage(page + 1)}
                  className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full border text-sm font-Urbanist font-medium transition-colors ${
                    pagination.currentPage === page + 1
                      ? 'bg-white/10 border-[#00FF37]/50 text-[#00FF37] shadow-[0_0_12px_-2px_#00FF37]'
                      : 'border-white/20 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {page + 1}
                </button>
              ))}
 
              <button
                onClick={() => handleChangePage(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full border transition-colors ${
                  pagination.currentPage === pagination.totalPages
                    ? 'border-white/10 text-white/20 cursor-not-allowed'
                    : 'border-white/20 text-white/70 hover:bg-white/10'
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