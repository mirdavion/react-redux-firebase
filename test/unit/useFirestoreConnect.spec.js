import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-dom/test-utils'
import { some, isMatch, filter } from 'lodash'
import {
  ErrorBoundary,
  storeWithFirestore,
  firebaseWithConfig,
  sleep
} from '../utils'
import useFirestoreConnect, {
  createUseFirestoreConnect
} from '../../src/useFirestoreConnect'
import ReactReduxFirebaseProvider from '../../src/ReactReduxFirebaseProvider'
import { createFirestoreInstance } from 'redux-firestore'

/* eslint-disable react/prop-types */
function TestComponent({ dynamicProps }) {
  useFirestoreConnect(
    dynamicProps === null
      ? dynamicProps
      : `test${dynamicProps ? '/' + dynamicProps : ''}`,
    [dynamicProps]
  )
  return <div />
}
/* eslint-enable react/prop-types */

const createContainer = ({
  additionalComponentProps,
  listeners,
  component = TestComponent
} = {}) => {
  const firebase = firebaseWithConfig()
  const store = storeWithFirestore()
  sinon.spy(store, 'dispatch')

  class Container extends Component {
    state = { test: 'testing', dynamic: '' }

    render() {
      const InnerComponent = component
      return (
        <ReactReduxFirebaseProvider
          dispatch={store.dispatch}
          firebase={firebase}
          createFirestoreInstance={createFirestoreInstance}
          config={{}}>
          <ErrorBoundary>
            <InnerComponent
              dynamicProps={this.state.dynamic}
              testProps={this.state.test}
              {...additionalComponentProps}
            />
          </ErrorBoundary>
        </ReactReduxFirebaseProvider>
      )
    }
  }

  const tree = TestUtils.renderIntoDocument(<Container />)

  return {
    parent: TestUtils.findRenderedComponentWithType(tree, Container),
    dispatch: store.dispatch,
    firebase,
    store
  }
}

describe('useFirestoreConnect', () => {
  it('enables watchers on mount', async () => {
    const { dispatch } = createContainer()
    await sleep()
    expect(
      some(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reduxFirestore/SET_LISTENER',
          meta: { collection: 'test' },
          payload: { name: 'test' }
        })
      )
    ).to.be.true
  })

  it('enables multiple watchers', async () => {
    const { dispatch } = createContainer({
      component: () => {
        useFirestoreConnect(
          [{ collection: 'test1' }, { collection: 'test2' }],
          []
        )
        return null
      }
    })
    await sleep()
    expect(
      some(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reduxFirestore/SET_LISTENER',
          meta: { collection: 'test1' }
        })
      )
    ).to.be.true
    expect(
      some(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reduxFirestore/SET_LISTENER',
          meta: { collection: 'test2' }
        })
      )
    ).to.be.true
  })

  it('disables watchers on unmount', async () => {
    const { parent, dispatch } = createContainer()
    await sleep()
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(parent).parentNode)
    await sleep()
    expect(
      some(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reduxFirestore/UNSET_LISTENER',
          meta: { collection: 'test' },
          payload: { name: 'test' }
        })
      )
    ).to.be.true
  })

  it('disables watchers on null as query', async () => {
    const { parent, dispatch } = createContainer()
    await sleep()
    parent.setState({ dynamic: null })
    await sleep()
    expect(
      filter(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reduxFirestore/SET_LISTENER'
        })
      )
    ).to.have.lengthOf(1)
  })

  it('does not change watchers with props changes that do not change listener paths', async () => {
    const { parent, dispatch } = createContainer()
    await sleep()
    parent.setState({ test: 'somethingElse' })
    await sleep()
    expect(
      filter(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reduxFirestore/SET_LISTENER'
        })
      )
    ).to.have.lengthOf(1)
  })

  it('reapplies watchers when props change', async () => {
    const { parent, dispatch } = createContainer()
    await sleep()
    parent.setState({ dynamic: 'somethingElse' })
    await sleep()

    expect(
      filter(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reduxFirestore/UNSET_LISTENER',
          meta: { collection: 'test' },
          payload: { name: 'test' }
        })
      )
    ).to.have.lengthOf(1)
    expect(
      filter(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reduxFirestore/SET_LISTENER',
          meta: { collection: 'test', doc: 'somethingElse' },
          payload: { name: 'test/somethingElse' }
        })
      )
    ).to.have.lengthOf(1)
  })
})

describe('createUseFirestoreConnect', () => {
  it('creates a function', () => {
    expect(createUseFirestoreConnect('store2')).to.be.a.function
  })
})
