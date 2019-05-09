import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-dom/test-utils'
import { some, isMatch, filter } from 'lodash'
import {
  ErrorBoundary,
  storeWithFirebase,
  firebaseWithConfig,
  sleep
} from '../utils'
import useFirebaseConnect, {
  createUseFirebaseConnect
} from '../../src/useFirebaseConnect'
import ReactReduxFirebaseProvider from '../../src/ReactReduxFirebaseProvider'
import { createFirestoreInstance } from 'redux-firestore'

/* eslint-disable react/prop-types */
function TestComponent({ dynamicProps }) {
  useFirebaseConnect(!dynamicProps ? dynamicProps : `test/${dynamicProps}`)
  return <div />
}
/* eslint-enable react/prop-types */

const createContainer = ({
  additionalComponentProps,
  listeners,
  component = TestComponent
} = {}) => {
  const firebase = firebaseWithConfig()
  const store = storeWithFirebase()
  sinon.spy(store, 'dispatch')

  class Container extends Component {
    state = { test: 'testing', dynamic: 'start' }

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

describe('useFirebaseConnect', () => {
  it('enebles watchers on mount', async () => {
    const { dispatch } = createContainer()
    await sleep()
    expect(
      some(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reactReduxFirebase/SET_LISTENER',
          path: 'test/start'
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
          type: '@@reactReduxFirebase/UNSET_LISTENER',
          path: 'test/start'
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
          type: '@@reactReduxFirebase/SET_LISTENER'
        })
      )
    ).to.have.lengthOf(1)
  })

  it('does not change watchers props changes that do not change listener paths', async () => {
    const { parent, dispatch } = createContainer()
    await sleep()
    parent.setState({ test: 'somethingElse' })
    await sleep()
    expect(
      filter(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reactReduxFirebase/SET_LISTENER'
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
          type: '@@reactReduxFirebase/UNSET_LISTENER',
          path: 'test/start'
        })
      )
    ).to.have.lengthOf(1)
    expect(
      filter(dispatch.args, arg =>
        isMatch(arg[0], {
          type: '@@reactReduxFirebase/SET_LISTENER',
          path: 'test/somethingElse'
        })
      )
    ).to.have.lengthOf(1)
  })

  it('should not accept array', async () => {
    const useFirebaseConnectSpy = sinon.spy(useFirebaseConnect)
    const Component = () => {
      useFirebaseConnectSpy(['test'])
      return <div />
    }
    createContainer({ component: Component })
    await sleep()
    expect(useFirebaseConnectSpy.threw()).to.be.true
  })
})

describe('createUseFirebaseConnect', () => {
  it('accepts a different store key', () => {
    createUseFirebaseConnect('store2')
  })
})
