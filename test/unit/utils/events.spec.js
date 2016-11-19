/* global describe expect it beforeEach */
import { getEventsFromInput } from '../../../src/utils/events'

describe('Events Utils', () => {
  describe('getEventsFromInput', () => {
    it('handles null path array', () => {
      expect(getEventsFromInput()).to.be.an.array
    })
    describe('path types', () => {
      it('throws for null', () => {
        expect(() => getEventsFromInput([null])).to.throw(Error)
      })
      it('accepts string', () => {
        expect(getEventsFromInput(['some'])[0]).to.include.keys('path')
      })
      it('accepts object', () => {
        expect(getEventsFromInput([{path: 'some'}])[0]).to.include.keys('path')
      })
      it('accepts array', () => {
        expect(getEventsFromInput([['somechild']])[0]).to.include.keys('path')
      })
    })
    describe('populate', () => {
      it('populates parameter set populates exist', () => {
        expect(getEventsFromInput(['some#populate=uid:users'])[0]).to.include.keys('populates')
      })
      it('populates parameter not set if none exists', () => {
        expect(getEventsFromInput(['some'])[0]).to.not.include.keys('populates')
      })

    })

  })
})
