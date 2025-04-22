import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Download, Search, Eye, Trash } from 'lucide-react';
import Swal from 'sweetalert2';
import logobuff from '../assets/logobuff0033.png'
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
    <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-2xl font-semibold text-gray-800">Lista de Ordenes</h1>
        <div className="flex space-x-2">
        <button 
          onClick={() => setPdfReady(true)}
          className="px-4 py-2 flex items-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
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
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden backdrop-filter backdrop-blur-lg">
        <div className="overflow-x-auto rounded-xl ">
          <table className="w-full ">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Numero Orden</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Order</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comprador</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Digitos Tarjeta</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="text-left py-4 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actiones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">#{order._id}</td>
                  <td className="p-4 text-gray-500">{new Date(order.updatedAt).toLocaleDateString('es-CO')}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{order.customer.fullName}</div>
                  </td>
                  <td className="p-4">
                    {renderStatus(order.status)}
                  </td>
                  <td className="p-4">
                    {order.payment?.cardLast4}
                  </td>
                  <td className="p-4 font-medium text-gray-900">${(order.totals.total).toLocaleString('en-US')}</td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewOrder(order._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 transition"
                        title="View Order"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition"
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
              Showing <span className="font-medium">{indexOfFirst + 1}</span> to <span className="font-medium">{Math.min(indexOfLast, totalFiltered)}</span> of{' '}
              <span className="font-medium">{totalFiltered}</span> results
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

export default Listaordenes;