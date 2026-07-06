'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Users, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  UserX
} from 'lucide-react'
import { API } from '@/lib/config'
import { motion } from 'framer-motion'

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  isActive: boolean
  addresses?: Array<{
    fullName: string
    address: string
    city: string
    phone: string
  }>
  createdAt: string
  orderCount: number
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [search, page])

  const fetchUsers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      if (search) params.append('search', search)

      const res = await fetch(`${API.admin.users}?${params}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${API.admin.users}/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (res.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const viewUserDetails = async (user: User) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 bg-gray-50 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500">Manage registered customers</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : users.length === 0 ? null : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Orders</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Joined</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-blue-600 font-medium">{user.name?.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-gray-600 text-sm">{user.phone || 'Not provided'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {user.orderCount} orders
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleUserStatus(user._id, user.isActive !== false)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                          user.isActive !== false 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {user.isActive !== false ? (
                          <><UserCheck className="w-4 h-4" /> Active</>
                        ) : (
                          <><UserX className="w-4 h-4" /> Inactive</>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewUserDetails(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-gray-500 text-sm">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-gray-100"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{selectedUser.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-500 text-sm">Phone</p>
                  <p className="text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-500 text-sm">Total Orders</p>
                  <p className="text-gray-900">{selectedUser.orderCount}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-500 text-sm">Member Since</p>
                  <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-gray-500 text-sm">Status</p>
                  <p className={selectedUser.isActive !== false ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {selectedUser.isActive !== false ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              {selectedUser.addresses && selectedUser.addresses.length > 0 && (
                <div>
                  <h4 className="text-gray-500 text-sm mb-2 font-medium">Addresses</h4>
                  <div className="space-y-2">
                    {selectedUser.addresses.map((addr, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-gray-900">{addr.fullName}</p>
                        <p className="text-gray-500 text-sm">{addr.address}, {addr.city}</p>
                        <p className="text-gray-500 text-sm">{addr.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
