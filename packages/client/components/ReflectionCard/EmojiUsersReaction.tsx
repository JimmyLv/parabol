import styled from '@emotion/styled'
import graphql from 'babel-plugin-relay/macro'
import React from 'react'
import {useFragment} from 'react-relay'
import {EmojiUsersReaction_reactji$key} from '~/__generated__/EmojiUsersReaction_reactji.graphql'
import {PALETTE} from '../../styles/paletteV3'

const EmojiUsersReactionRoot = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  maxHeight: 300,
  maxWidth: 280,
  overflow: 'auto',
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  whiteSpace: 'normal'
})

const DarkerGrayPart = styled('span')({
  color: PALETTE.SLATE_400
})

const LIST_FORMATTER =
  Intl.ListFormat !== undefined
    ? new Intl.ListFormat('en', {style: 'long', type: 'conjunction'})
    : {format: (arr: string[]) => arr.join(', ')} // fallback for safari pre Big Sur

interface Props {
  reactjiRef: EmojiUsersReaction_reactji$key
  reactjiShortName?: string
}

const EmojiUsersReaction = ({reactjiRef, reactjiShortName}: Props) => {
  const reactji = useFragment(
    graphql`
      fragment EmojiUsersReaction_reactji on Reactji {
        id
        users {
          id
          preferredName
        }
      }
    `,
    reactjiRef
  )

  return (
    <EmojiUsersReactionRoot>
      {LIST_FORMATTER.format(reactji.users.map(({preferredName}) => preferredName))}
      {reactjiShortName && <DarkerGrayPart>reacted with :{reactjiShortName}:</DarkerGrayPart>}
    </EmojiUsersReactionRoot>
  )
}

export default React.memo(EmojiUsersReaction)
