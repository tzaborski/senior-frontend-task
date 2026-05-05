import { describe, it, expect } from 'vitest'
import { fmtTime } from './format.js'

describe('fmtTime', () => {
  it('returns null when given null', () => {
    expect(fmtTime(null)).toBeNull()
  })

  it('returns null when given undefined', () => {
    expect(fmtTime(undefined)).toBeNull()
  })

  it('formats 0 seconds as 0:00', () => {
    expect(fmtTime(0)).toBe('0:00')
  })

  it('zero-pads seconds below 10', () => {
    expect(fmtTime(5)).toBe('0:05')
  })

  it('formats seconds under a minute', () => {
    expect(fmtTime(45)).toBe('0:45')
  })

  it('formats exactly one minute', () => {
    expect(fmtTime(60)).toBe('1:00')
  })

  it('formats minutes and seconds', () => {
    expect(fmtTime(125)).toBe('2:05')
  })

  it('handles values over an hour without an hour segment', () => {
    expect(fmtTime(3661)).toBe('61:01')
  })

  it('floors fractional seconds', () => {
    expect(fmtTime(65.9)).toBe('1:05')
  })

  it('floors fractional minutes correctly', () => {
    expect(fmtTime(119.99)).toBe('1:59')
  })
})
