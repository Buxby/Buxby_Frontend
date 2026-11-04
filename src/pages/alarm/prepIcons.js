import { Backpack, Bed, Shirt, ShowerHead, Sparkle } from 'lucide-react'

export const PREP_ICONS = { bed: Bed, shower: ShowerHead, shirt: Shirt, bag: Backpack, etc: Sparkle }

export const prepIcon = (key) => PREP_ICONS[key] ?? Sparkle
