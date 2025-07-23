"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Check, Plus, Tag, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { useTagSuggestions } from "@/hooks/use-tag-suggestions"

interface TagInputWithSuggestionsProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  disabled?: boolean
  placeholder?: string
  label?: string
}

export function TagInputWithSuggestions({
  tags,
  onTagsChange,
  disabled = false,
  placeholder = "Add a tag",
  label = "Tags",
}: TagInputWithSuggestionsProps) {
  const [inputValue, setInputValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { suggestions, isNewTag, isLoading } = useTagSuggestions({
    currentTags: tags,
    query: inputValue,
  })

  // Close popover when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag])
      setInputValue("")
      setIsOpen(false)

      // Focus back to input for continuous tagging
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (!disabled) {
      onTagsChange(tags.filter((tag) => tag !== tagToRemove))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Open popover when user starts typing
    if (value.trim() && !isOpen) {
      setIsOpen(true)
    }

    // Close popover when input is empty
    if (!value.trim() && isOpen) {
      setIsOpen(false)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()

      if (inputValue.trim()) {
        // If there are suggestions, add the first one, otherwise add as new tag
        if (suggestions.length > 0) {
          handleAddTag(suggestions[0])
        } else if (isNewTag) {
          handleAddTag(inputValue.trim())
        }
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      handleRemoveTag(tags[tags.length - 1])
    } else if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  const handleSuggestionSelect = (suggestion: string) => {
    handleAddTag(suggestion)
  }

  const handleAddNewTag = () => {
    if (inputValue.trim() && isNewTag) {
      handleAddTag(inputValue.trim())
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Display current tags */}
      <div className="flex flex-wrap gap-2 mb-2" aria-label="Current tags">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {tag}
            {!disabled && (
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemoveTag(tag)}
                aria-label={`Remove ${tag} tag`}
              />
            )}
          </Badge>
        ))}
        {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags added yet</span>}
      </div>

      {/* Tag input with suggestions */}
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="pr-8"
                aria-label="Enter tag name"
                onFocus={() => {
                  if (inputValue.trim()) {
                    setIsOpen(true)
                  }
                }}
              />
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => {
                    setInputValue("")
                    setIsOpen(false)
                    inputRef.current?.focus()
                  }}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </PopoverTrigger>

          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandList>
                {isLoading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">Loading suggestions...</div>
                ) : (
                  <>
                    {suggestions.length > 0 && (
                      <CommandGroup heading="Existing Tags">
                        {suggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion}
                            value={suggestion}
                            onSelect={() => handleSuggestionSelect(suggestion)}
                            className="cursor-pointer"
                          >
                            <Tag className="mr-2 h-4 w-4" />
                            <span>{suggestion}</span>
                            <Check className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100" />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {isNewTag && (
                      <>
                        {suggestions.length > 0 && <div className="border-t my-1" />}
                        <CommandGroup heading="Create New Tag">
                          <CommandItem
                            value={inputValue}
                            onSelect={handleAddNewTag}
                            className="cursor-pointer text-primary"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Create "{inputValue.trim()}"</span>
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}

                    {suggestions.length === 0 && !isNewTag && inputValue.trim() && (
                      <CommandEmpty>
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No matching tags found.
                          <br />
                          <span className="text-xs">Press Enter to create a new tag.</span>
                        </div>
                      </CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          onClick={() => {
            if (suggestions.length > 0) {
              handleAddTag(suggestions[0])
            } else if (isNewTag) {
              handleAddTag(inputValue.trim())
            }
          }}
          size="sm"
          disabled={disabled || !inputValue.trim()}
          aria-label="Add tag"
        >
          <Tag className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Helper text */}
      <div className="text-xs text-muted-foreground">
        {inputValue.trim() && suggestions.length > 0 && (
          <span>Press Enter or click to select the first suggestion</span>
        )}
        {inputValue.trim() && isNewTag && <span>Press Enter to create new tag "{inputValue.trim()}"</span>}
        {!inputValue.trim() && <span>Start typing to see tag suggestions or create new ones</span>}
      </div>
    </div>
  )
}
