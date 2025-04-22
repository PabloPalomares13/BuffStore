import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Mail, Phone } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logobuff from '../assets/logobuff0033.png';

const link = import.meta.env.PROD 
  ? import.meta.env.VITE_BACKEND_URL
  : 'http://localhost:3000'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  logoContainer: {
    width: 140,
    height: 70,
    marginBottom: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6', // Azul moderno
    marginBottom: 5,
  },
  orderIdText: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#6B7280',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE', // Azul claro
    color: '#2563EB',
    padding: '5 10',
    borderRadius: 4,
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginVertical: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoColumn: {
    width: '50%',
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 11,
    color: '#111827',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  tableCol1: {
    width: '40%',
    fontSize: 10,
  },
  tableCol2: {
    width: '20%',
    fontSize: 10,
    textAlign: 'right',
  },
  tableCol3: {
    width: '20%',
    fontSize: 10,
    textAlign: 'right',
  },
  tableCol4: {
    width: '20%',
    fontSize: 10,
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  summaryContainer: {
    marginTop: 10,
    marginLeft: 'auto',
    width: '50%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 10,
    color: '#111827',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    fontSize: 9,
    color: '#6B7280',
    textAlign: 'center',
  },
  companyDetails: {
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 5,
  }
});

// Componente del PDF para la Factura
const OrderPDF = ({ order }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para determinar el color del estado
  const getStatusColors = (status) => {
    const statusStyles = {
      'paid': { bg: '#DCFCE7', text: '#16A34A' },
      'pending': { bg: '#FEF3C7', text: '#D97706' },
      'shipped': { bg: '#DBEAFE', text: '#2563EB' },
      'delivered': { bg: '#E0E7FF', text: '#4F46E5' },
      'cancelled': { bg: '#FEE2E2', text: '#DC2626' }
    };
    
    return statusStyles[status] || { bg: '#F3F4F6', text: '#4B5563' };
  };

  const statusColors = getStatusColors(order.status);

  return (
    <Document>
    <Page size="A4" style={styles.page}>
      {/* Header con Logo y Detalles de la Orden */}
      <View style={styles.headerSection}>
        <View>
          
          <View style={styles.logoContainer}>
            
            <Image 
              src={logobuff} 
              alt="Logo" 
              style={styles.logo}
            />
          </View>
          <Text style={styles.orderIdText}>ORDEN #{order._id}</Text>
          <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={styles.documentTitle}>FACTURA</Text>
          <Text style={{
            ...styles.statusBadge,
            backgroundColor: statusColors.bg,
            color: statusColors.text
          }}>
            {order.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      {/* Datos del cliente y envío en dos columnas */}
      <View style={styles.infoContainer}>
        <View style={styles.infoColumn}>
          <Text style={styles.sectionTitle}>Información del Cliente</Text>
          <Text style={styles.infoLabel}>NOMBRE</Text>
          <Text style={styles.infoValue}>{order.customer.fullName}</Text>
          <Text style={styles.infoLabel}>EMAIL</Text>
          <Text style={styles.infoValue}>{order.customer.email}</Text>
          <Text style={styles.infoLabel}>TELÉFONO</Text>
          <Text style={styles.infoValue}>{order.customer.phone}</Text>
        </View>
        
        <View style={styles.infoColumn}>
          <Text style={styles.sectionTitle}>Dirección de Envío</Text>
          <Text style={styles.infoLabel}>DIRECCIÓN</Text>
          <Text style={styles.infoValue}>{order.shipping.address}</Text>
          <Text style={styles.infoLabel}>CIUDAD/ESTADO</Text>
          <Text style={styles.infoValue}>{order.shipping.city}, {order.shipping.state}</Text>
          <Text style={styles.infoLabel}>CÓDIGO POSTAL</Text>
          <Text style={styles.infoValue}>{order.shipping.zipCode}</Text>
        </View>
      </View>
      
      {/* Información de pago */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de Pago</Text>
        <View style={styles.infoContainer}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>MÉTODO DE PAGO</Text>
            <Text style={styles.infoValue}>Tarjeta de crédito</Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>TITULAR</Text>
            <Text style={styles.infoValue}>{order.payment.cardName}</Text>
            <Text style={styles.infoLabel}>NÚMERO</Text>
            <Text style={styles.infoValue}>**** **** **** {order.payment.cardLast4}</Text>
          </View>
        </View>
      </View>
      
      {/* Tabla de productos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productos</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol1, styles.tableHeaderText]}>PRODUCTO</Text>
            <Text style={[styles.tableCol2, styles.tableHeaderText]}>PRECIO</Text>
            <Text style={[styles.tableCol3, styles.tableHeaderText]}>CANTIDAD</Text>
            <Text style={[styles.tableCol4, styles.tableHeaderText]}>TOTAL</Text>
          </View>
          
          {order.products.map((item, index) => (
            <View 
              key={index} 
              style={[
                styles.tableRow, 
                index === order.products.length - 1 ? styles.lastRow : {}
              ]}
            >
              <Text style={styles.tableCol1}>{item.name}</Text>
              <Text style={styles.tableCol2}>${item.price.toFixed(2)}</Text>
              <Text style={styles.tableCol3}>{item.quantity}</Text>
              <Text style={styles.tableCol4}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>
        
        {/* Resumen de totales */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              ${order.totals.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Impuestos</Text>
            <Text style={styles.summaryValue}>
              ${order.totals.taxes.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>
              ${order.totals.total.toLocaleString('en-US', {minimumFractionDigits: 2})}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text>Gracias por su compra</Text>
        <Text style={styles.companyDetails}>
          BUFF STORE CO • www.buffstore.com • +57 312 434 7352
        </Text>
      </View>
    </Page>
  </Document>
);
};


const Detallesorden = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Asegurarse de que estamos en el cliente (no en SSR)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para obtener los datos de la orden específica
  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${link}/api/orders/${id}`);
  
      if (!response.ok) {
        throw new Error("Error al obtener la información de la orden");
      }
  
      const data = await response.json();
      console.log("Datos de la orden:", data);
  
      setOrder(data);
      setLoading(false);
    } catch (err) {
      console.error("Error al obtener los detalles de la orden:", err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const handleGoBack = () => {
    navigate('/listaordenes');
  };

  const handleDownloadReceipt = () => {
    setPdfReady(true);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Error: {error}</h2>
        <button 
          onClick={handleGoBack}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Volver a la lista de pedidos
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Pedido no encontrado</h2>
        <button 
          onClick={handleGoBack}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Volver a la lista de pedidos
        </button>
      </div>
    );
  }

  // Status badge renderer
  const renderStatusBadge = (status) => {
    const statusClasses = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'shipped': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-purple-100 text-purple-800',
      'cancelled': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white/30 backdrop-blur-md rounded-xl shadow-lg border border-white/40 p-6">
      {/* Header Seccion */}
      <div className="flex justify-between items-center p-6 border-b">
        <div className="flex items-center">
          <button 
            onClick={handleGoBack}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-800">
                Orden #{order._id}
              </h1>
              {renderStatusBadge(order.status)}
            </div>
            <p className="text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div>
          <button 
            onClick={handleDownloadReceipt}
            className="px-4 py-2 flex items-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download size={16} className="mr-2" />
            Descargar Recibo
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Customer Information */}
        <div className="col-span-1">
          <div className="bg-white/50 rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Información del Comprador</h2>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                <span className="text-gray-600 font-medium">{order.customer.fullName.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{order.customer.fullName}</h3>
              </div>
            </div>
            <div className="flex items-center text-gray-600 mb-2">
              <Mail size={16} className="mr-2" />
              <a href={`mailto:${order.customer.email}`} className="text-blue-600 hover:underline">
                {order.customer.email}
              </a>
            </div>
            <div className="flex items-center text-gray-600">
              <Phone size={16} className="mr-2" />
              <a href={`tel:${order.customer.phone}`} className="text-blue-600 hover:underline">
                {order.customer.phone}
              </a>
            </div>
          </div>

          <div className="bg-white/50 rounded-xl shadow-sm border border-gray-100 p-6 mt-4">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Dirección de Facturación</h2>
            <address className="not-italic text-gray-600">
              {order.shipping.address}<br />
              {order.shipping.city}, {order.shipping.state} <br />{order.shipping.zipCode}
            </address>
          </div>

          <div className="bg-white/50 rounded-xl shadow-sm border border-gray-100 p-6 mt-4">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Información de Pago</h2>
            <div className="text-gray-600">
              <p>Nombre en tarjeta: {order.payment.cardName}</p>
              <p>Últimos 4 dígitos: **** **** **** {order.payment.cardLast4}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="col-span-1 md:col-span-2">
          <div className="bg-white/50 rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Productos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.products.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden mr-4">
                            {/* Placeholder para la imagen del producto */}
                            <img
                              src={`http://localhost:3000/api/products/image/${item.productId}/0`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700">${item.price.toFixed(2)}</td>
                      <td className="py-4 px-4 text-gray-700">{item.quantity}</td>
                      <td className="py-4 px-4 text-right text-gray-900 font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white/50 rounded-xl shadow-sm border border-gray-100 p-6 mt-4">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Resumen del Pago</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">${order.totals.subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Impuestos</span>
                <span className="text-gray-800">${order.totals.taxes.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span className="text-gray-800">Total</span>
                  <span className="text-gray-900">${order.totals.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Download Component - Solo se renderiza cuando se solicita */}
      {pdfReady && (
        <div style={{ display: 'none' }}>
          <PDFDownloadLink
            document={<OrderPDF order={order} />}
            fileName={`factura-orden-${order._id}.pdf`}
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
    </div>
  );
};

export default Detallesorden;