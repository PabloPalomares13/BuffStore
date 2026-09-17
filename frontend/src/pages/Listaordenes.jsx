import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Download, Search, Eye, Trash } from 'lucide-react';
import Swal from 'sweetalert2';
import logobuff from '../assets/BLogo4k.png';
import { 
  PDFDownloadLink, 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image 
} from '@react-pdf/renderer';

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  logo: {
    marginBottom: 20,
    width: 300,
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
  tableColOrderId: { width: '20%', textAlign: 'left', paddingLeft: 8 },
  tableColDate: { width: '15%', textAlign: 'left', paddingLeft: 8 },
  tableColCustomer: { width: '25%', textAlign: 'left', paddingLeft: 8 },
  tableColStatus: { width: '15%', textAlign: 'left', paddingLeft: 8 },
  tableColCard: { width: '10%', textAlign: 'left', paddingLeft: 8 },
  tableColTotal: { width: '15%', textAlign: 'left', paddingLeft: 8 },
  tableHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  tableCell: {
    fontSize: 10,
    color: '#4B5563',
  },
  statusPaid: {
    color: '#10B981',
    fontSize: 10,
  },
  statusPending: {
    color: '#F59E0B',
    fontSize: 10,
  },
  statusFailed: {
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
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    fontSize: 10,
    color: '#6B7280',
  },
});


const OrdersPDF = ({ orders }) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Image style={styles.logo} src={logobuff} alt="Logo" /> 
        <Text style={styles.header}>Lista de Órdenes</Text>
        <Text style={styles.subHeader}>Generado el {new Date().toLocaleDateString('es-CO')}</Text>
        
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableColOrderId}>
              <Text style={styles.tableHeader}>Numero Orden</Text>
            </View>
            <View style={styles.tableColDate}>
              <Text style={styles.tableHeader}>Fecha</Text>
            </View>
            <View style={styles.tableColCustomer}>
              <Text style={styles.tableHeader}>Comprador</Text>
            </View>
            <View style={styles.tableColStatus}>
              <Text style={styles.tableHeader}>Status</Text>
            </View>
            <View style={styles.tableColCard}>
              <Text style={styles.tableHeader}>Digitos Tarjeta</Text>
            </View>
            <View style={styles.tableColTotal}>
              <Text style={styles.tableHeader}>Total</Text>
            </View>
          </View>
          
          {/* Table Rows */}
          {orders.map((order) => (
            <View key={order._id} style={styles.tableRow}>
              <View style={styles.tableColOrderId}>
                <Text style={styles.tableCell}>#{order._id}</Text>
              </View>
              <View style={styles.tableColDate}>
                <Text style={styles.tableCell}>{new Date(order.updatedAt).toLocaleDateString('es-CO')}</Text>
              </View>
              <View style={styles.tableColCustomer}>
                <Text style={styles.tableCell}>{order.customer.fullName}</Text>
              </View>
              <View style={styles.tableColStatus}>
                <Text 
                  style={
                    order.status === 'paid' ? styles.statusPaid : 
                    order.status === 'pending' ? styles.statusPending : 
                    styles.statusFailed
                  }
                >
                  {order.status}
                </Text>
              </View>
              <View style={styles.tableColCard}>
                <Text style={styles.tableCell}>{order.payment?.cardLast4}</Text>
              </View>
              <View style={styles.tableColTotal}>
                <Text style={styles.tableCell}>${(order.totals.total).toLocaleString('en-US')}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <Text style={styles.footer}>
          © {new Date().getFullYear()} - Sistema de Gestión de Órdenes
        </Text>
        <Text 
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} 
          fixed 
        />
      </Page>
    </Document>
  );
};

const PRODUCTS_PER_PAGE = 10;
const Listaordenes = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
      setIsClient(true);
    }, []);
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${link}/api/orders/`);
      if (!response.ok) {
        throw new Error("Error al obtener los productos");
      }
      const data = await response.json();
      
      setOrders(data);
      setPagination(prev => ({ ...prev, total: data.length || 0 }));
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewOrder = (orderId) => {
    navigate(`/detallesorden/${orderId}`);
  };

  const handleDeleteOrder = async (orderid) => {
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
        const response = await fetch(`${link}/api/orders/${orderid}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Error al eliminar el producto');
        }
        Swal.fire('Eliminado', 'La orden ha sido eliminado con éxito.', 'success');
        fetchOrders();
      } catch (err) {
        console.error(err);
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const handleChangePage = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    return (
      order.customer.fullName.toLowerCase().includes(term) ||
      String(order.totals.total).includes(term) ||
      order.payment.cardLast4.includes(term) ||
      order.shipping.city.toLowerCase().includes(term) ||
      order.shipping.state.toLowerCase().includes(term)
    );
  });
  
  const totalFiltered = filteredOrders.length;
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
  const currentOrders = filteredOrders.slice(indexOfFirst, indexOfLast);

  // Renderizar el status con el color correspondiente
  const renderStatus = (status) => {
    let bgColor, textColor, dotColor;
    
    switch(status) {
      case 'paid':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        dotColor = 'bg-green-500';
        break;
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        dotColor = 'bg-yellow-500';
        break;
      case 'failed':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        dotColor = 'bg-red-500';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        dotColor = 'bg-gray-500';
    }

    return (
      <div className={`flex items-center px-3 py-1 rounded-full ${bgColor} ${textColor}`}>
        <div className={`w-2 h-2 rounded-full ${dotColor} mr-2`}></div>
        {status}
      </div>
    );
  };

  return (
    <div className="relative bg-transparent backdrop-blur-md rounded-[20px] shadow-[0_0_20px_5px_rgba(0,0,0,0.15)] shadow-[#000000]/70 p-6 overflow-hidden"
      style={{ fontFamily: '"Urbanist", sans-serif' }}>
      {/* Manchas de luz neón difuminadas */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#FF137A] opacity-40 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#00FF37] opacity-40 blur-[120px]" />

      <div className="relative flex justify-between items-center p-6 border-b border-white/10 flex-wrap gap-4">
        <h1 className="font-haze uppercase text-2xl tracking-widest text-white">
          Lista de <span className="text-[#00FF37]">Ordenes</span>
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setPdfReady(true)}
          className="px-4 py-2 flex items-center text-sm font-Urbanist text-white/80 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 hover:scale-105 transform transition-colors duration-200"
        >
          <Download size={16} className="mr-2" />
          Exportar Lista
        </button>
        {pdfReady && isClient &&(
          <div style={{ display: 'none' }}>
            <PDFDownloadLink
              document={<OrdersPDF orders={filteredOrders} />}
              fileName={`ordenes-${new Date().toISOString().split('T')[0]}.pdf`}
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
          <div className="relative w-60 max-w-full">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar"
              className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-Urbanist text-white placeholder-white/40 focus:outline-none focus:border-[#00FF37]/50 focus:shadow-[0_0_12px_-2px_#00FF37] transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="relative bg-black/40 rounded-[20px] border border-white/20 overflow-hidden backdrop-blur-md mt-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Numero Orden</th>
                <th className="text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Fecha Order</th>
                <th className="text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Comprador</th>
                <th className="text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Digitos Tarjeta</th>
                <th className="text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Total</th>
                <th className="text-left py-4 px-5 text-xs font-Urbanist font-semibold text-white/50 uppercase tracking-wider">Actiones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-Urbanist font-medium text-white">#{order._id}</td>
                  <td className="p-4 font-Urbanist text-white/60">{new Date(order.updatedAt).toLocaleDateString('es-CO')}</td>
                  <td className="p-4">
                    <div className="font-Urbanist font-medium text-white">{order.customer.fullName}</div>
                  </td>
                  <td className="p-4">
                    {renderStatus(order.status)}
                  </td>
                  <td className="p-4 font-Urbanist text-white/60">
                    {order.payment?.cardLast4}
                  </td>
                  <td className="p-4 font-Urbanist font-medium text-white">${(order.totals.total).toLocaleString('en-US')}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewOrder(order._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/60 hover:border-[#00FF37]/50 hover:text-[#00FF37] hover:bg-[#00FF37]/10 hover:scale-105 transform transition-colors duration-200"
                        title="View Order"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/60 hover:border-[#FF137A]/50 hover:text-[#FF137A] hover:bg-[#FF137A]/10 hover:scale-105 transform transition-colors duration-200"
                        title="Delete Order"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
              Showing <span className="font-medium text-white/90">{indexOfFirst + 1}</span> to <span className="font-medium text-white/90">{Math.min(indexOfLast, totalFiltered)}</span> of{' '}
              <span className="font-medium text-white/90">{totalFiltered}</span> results
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

export default Listaordenes;