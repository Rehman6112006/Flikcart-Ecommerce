import { Router, Request, Response } from 'express'
import { authenticateToken, reviewLimiter, Product, Review, User, categoryImages, createNotification } from '../helpers'

const router = Router()

router.get('/products', async (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 100 } = req.query
    let query: any = {}
    if (category && category !== 'all') query.category = category
    if (search) query.name = { $regex: search, $options: 'i' }
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }
    let sortOption: any = { createdAt: -1 }
    if (sort) {
      switch (sort) {
        case 'price-asc': sortOption = { price: 1 }; break
        case 'price-desc': sortOption = { price: -1 }; break
        case 'rating': sortOption = { rating: -1 }; break
        case 'newest': sortOption = { createdAt: -1 }; break
      }
    }
    const skip = (Number(page) - 1) * Number(limit)
    const products = await Product.find(query).sort(sortOption).skip(skip).limit(Number(limit))
    const total = await Product.countDocuments(query)
    const productsList = products.map((p: any) => {
      const imgs = (p.images && p.images.length > 0) ? p.images
        : categoryImages[p.category] ? [categoryImages[p.category][0]] : ['/placeholder-product.svg']
      return { ...p._doc, images: imgs }
    })
    res.json({ products: productsList, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error })
  }
})

router.get('/products/featured', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ isFeatured: true }).limit(10)
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching featured products', error })
  }
})

router.get('/products/category/:category', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ category: req.params.category })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error })
  }
})

router.get('/products/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await Product.distinct('category')
    res.json(categories)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error })
  }
})

router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error })
  }
})

router.post('/products', authenticateToken, async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body)
    await product.save()
    res.status(201).json(product)
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error })
  }
})

router.put('/products/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error })
  }
})

router.delete('/products/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error })
  }
})

router.post('/reviews', authenticateToken, reviewLimiter, async (req: any, res: Response) => {
  try {
    const { productId, rating, comment } = req.body
    if (!productId || !rating || !comment) return res.status(400).json({ message: 'All fields required' })

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const existingReview = await Review.findOne({ product: productId, user: req.user.id })
    if (existingReview) return res.status(400).json({ message: 'You already reviewed this product' })

    const user = await User.findById(req.user.id)
    const review = await Review.create({
      product: productId, user: req.user.id,
      name: user?.name || 'Anonymous',
      rating, comment
    })

    const allReviews = await Review.find({ product: productId })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: allReviews.length
    })

    res.status(201).json(review)
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error })
  }
})

router.get('/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 }).limit(20)
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error })
  }
})

export default router
