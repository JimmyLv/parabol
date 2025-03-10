import styled from '@emotion/styled'
import React, {useState} from 'react'
import DialogTitle from '~/components/DialogTitle'
import DialogContainer from '../../../../components/DialogContainer'
import Icon from '../../../../components/Icon'
import UpgradeLater from '../../../../components/UpgradeLater'
import UpgradeSuccess from '../../../../components/UpgradeSuccess'
import useAtmosphere from '../../../../hooks/useAtmosphere'
import PayLaterMutation from '../../../../mutations/PayLaterMutation'
import {PALETTE} from '../../../../styles/paletteV3'
import {ICON_SIZE} from '../../../../styles/typographyV2'
import {ExternalLinks} from '../../../../types/constEnums'
import CreditCardForm from './CreditCardForm'
import CreditCardReassurance from './CreditCardReassurance'

export type CreditCardModalActionType = 'update' | 'upgrade' | 'squeeze'

const Container = styled(DialogContainer)({
  width: 312
})

const Info = styled(Icon)({
  color: PALETTE.SLATE_600,
  fontSize: ICON_SIZE.MD18,
  paddingLeft: 8
})

interface Props {
  actionType: CreditCardModalActionType
  activeUserCount?: number
  closePortal: () => void
  orgId: string
  meetingId?: string
  onUpgrade?: () => void
}

type Status = 'success' | 'later' | 'init'

const CreditCardModal = (props: Props) => {
  const {actionType, activeUserCount, closePortal, orgId, meetingId, onUpgrade} = props
  const [status, setStatus] = useState<Status>('init')
  const atmosphere = useAtmosphere()
  const onSuccess =
    actionType === 'update'
      ? closePortal
      : () => {
          onUpgrade?.()
          setStatus('success')
        }
  const onLater = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('later')
  }

  const closeLater = () => {
    closePortal()
    PayLaterMutation(atmosphere, {meetingId: meetingId!})
  }

  if (status === 'success') return <UpgradeSuccess closePortal={closePortal} />
  if (status === 'later') return <UpgradeLater closePortal={closeLater} />

  return (
    <Container data-private>
      <DialogTitle>
        {actionType === 'update' ? 'Update Credit Card' : 'Upgrade to Pro'}
        {actionType !== 'update' && (
          <a href={ExternalLinks.PRICING_LINK} rel='noopener noreferrer' target='blank'>
            <Info>info</Info>
          </a>
        )}
      </DialogTitle>
      <CreditCardReassurance actionType={actionType} />
      <CreditCardForm
        actionType={actionType}
        activeUserCount={activeUserCount}
        orgId={orgId}
        onSuccess={onSuccess}
        onLater={onLater}
      />
    </Container>
  )
}

export default CreditCardModal
