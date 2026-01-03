import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { GENRES } from '@/lib/types'
import type { FilterOptions } from '@/lib/types'

interface FilterModalProps {
  open: boolean
  onClose: () => void
  onApply: (filters: FilterOptions) => void
  personName: string
}

export function FilterModal({
  open,
  onClose,
  onApply,
  personName,
}: FilterModalProps) {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [yearRange, setYearRange] = useState<'all' | 'old' | 'new'>('all')
  const [sortBy, setSortBy] = useState<'popularity' | 'rating'>('popularity')

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    )
  }

  const handleApply = () => {
    const currentYear = new Date().getFullYear()
    let range: { min: number; max: number } | null = null

    if (yearRange === 'old') {
      range = { min: 1900, max: 1999 }
    } else if (yearRange === 'new') {
      range = { min: 2000, max: currentYear }
    }

    onApply({
      genres: selectedGenres,
      yearRange: range,
      sortBy,
    })
  }

  const handleReset = () => {
    setSelectedGenres([])
    setYearRange('all')
    setSortBy('popularity')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Discover Movies with {personName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Sort By</Label>
            <RadioGroup value={sortBy} onValueChange={(val) => setSortBy(val as 'popularity' | 'rating')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="popularity" id="popularity" />
                <Label htmlFor="popularity" className="cursor-pointer">
                  Most Popular
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rating" id="rating" />
                <Label htmlFor="rating" className="cursor-pointer">
                  Highest Rated
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">Time Period</Label>
            <RadioGroup value={yearRange} onValueChange={(val) => setYearRange(val as 'all' | 'old' | 'new')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  All Time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="old" id="old" />
                <Label htmlFor="old" className="cursor-pointer">
                  Classic (Before 2000)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="cursor-pointer">
                  Modern (2000+)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}
            </Label>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-2">
                {GENRES.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`genre-${genre.id}`}
                      checked={selectedGenres.includes(genre.id)}
                      onCheckedChange={() => handleGenreToggle(genre.id)}
                    />
                    <Label
                      htmlFor={`genre-${genre.id}`}
                      className="cursor-pointer"
                    >
                      {genre.name}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApply} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Discover Movies
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
