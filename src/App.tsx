import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { LoginScreen } from './components/LoginScreen'
import { setStorageNamespace } from './hooks/usePersistentState'
import { auth } from './lib/auth'
import type { User } from './types'

type Session = { status: 'loading' } | { status: 'signed-out'; hasUsers: boolean } | { status: 'signed-in'; user: User; isNew: boolean }

/** Puerta de entrada: sin cuenta iniciada no se mide ni se muestra nada */
export function App() {
  const [session, setSession] = useState<Session>({ status: 'loading' })

  useEffect(() => {
    auth()
      .status()
      .then(({ hasUsers, user }) => {
        if (user) {
          setStorageNamespace(user.id)
          setSession({ status: 'signed-in', user, isNew: false })
        } else setSession({ status: 'signed-out', hasUsers })
      })
  }, [])

  const signIn = (user: User, isNew: boolean) => {
    setStorageNamespace(user.id)
    setSession({ status: 'signed-in', user, isNew })
  }

  const signOut = async () => {
    await auth().logout()
    setSession({ status: 'signed-out', hasUsers: true })
  }

  return (
    <>
      {/* Zona para arrastrar la ventana (la barra de título nativa está oculta) */}
      {window.devpulse && <div aria-hidden className="fixed inset-x-0 top-0 z-40 h-9 [-webkit-app-region:drag]" />}

      {session.status === 'loading' && <div className="min-h-screen" />}
      {session.status === 'signed-out' && <LoginScreen hasUsers={session.hasUsers} onAuthenticated={signIn} />}
      {session.status === 'signed-in' && (
        // key: al cambiar de cuenta, todo el estado del dashboard se vuelve a cargar desde cero
        <Dashboard key={session.user.id} user={session.user} isNewUser={session.isNew} onSignOut={signOut} />
      )}
    </>
  )
}
