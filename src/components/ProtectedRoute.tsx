import { useContext } from 'react'
import type { JSX, ReactElement } from 'react'

import { Navigate } from 'react-router-dom'

import AuthContext from '../contexts/AuthContext'

interface Props {
  children: ReactElement
}

export default function ProtectedRoute({ children }: Props): JSX.Element {
  const { token } = useContext(AuthContext)
  return token ? children : <Navigate to="/login" />
}
