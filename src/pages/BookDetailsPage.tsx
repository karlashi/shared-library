import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import {
  useBook,
  useProfile,
  useProfiles,
  useBookLoan,
  useLendBook,
  useReturnBook,
  useBookTags,
  useAllTags,
  useAddTag,
  useRemoveTag,
  useWishlist,
  useToggleWishlist,
  useTransferBook,
  useBookComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from '../services/queries'
import { TagInput } from '../components/TagInput'

export function BookDetailsPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const { user, profile } = useAuth()
  const isAdmin = !!profile?.is_admin
  const { data: book, isLoading: isBookLoading } = useBook(id)
  const { data: owner } = useProfile(book?.owner_id)
  const { data: loan } = useBookLoan(id)
  const { data: borrower } = useProfile(loan?.borrower_id)
  const { data: users = [] } = useProfiles()
  const { data: bookTags = [] } = useBookTags(id)
  const { data: allTags = [] } = useAllTags()
  const lendBook = useLendBook()
  const returnBook = useReturnBook()
  const addTag = useAddTag()
  const removeTag = useRemoveTag()
  const { data: wishlist = [] } = useWishlist(user?.id)
  const toggleWishlist = useToggleWishlist()
  const transferBook = useTransferBook()
  const { data: comments = [] } = useBookComments(id)
  const addComment = useAddComment()
  const updateComment = useUpdateComment()
  const deleteComment = useDeleteComment()

  const [selectedUser, setSelectedUser] = useState('')
  const [selectedTransferUser, setSelectedTransferUser] = useState('')
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')

  if (isBookLoading) return <p>{t('common.loading')}</p>
  if (!book) return <p>{t('bookDetails.notFound')}</p>

  const ownerName = owner?.name || t('common.unknown')
  const borrowerName = loan ? borrower?.name || t('common.unknown') : null

  const isBorrowed = !!borrowerName
  const isBlocked = book.status === 'Fuera de circulación'
  const isOwner = book.owner_id === user?.id
  const isWishlisted = wishlist.includes(book.id)

  const getStatus = () => {
    if (isBlocked) return 'blocked'
    if (isBorrowed) return 'borrowed'
    return 'available'
  }

  const status = getStatus()

  const lendToUser = () => {
    if (!selectedUser || !id) return alert(t('bookDetails.selectUserAlert'))

    lendBook.mutate(
      { bookId: id, borrowerId: selectedUser },
      {
        onSuccess: () => alert(t('bookDetails.lendSuccess')),
        onError: (error) => {
          console.error(error)
          alert(t('bookDetails.lendError'))
        },
      }
    )
  }

  const markAsReturned = () => {
    if (!loan) return

    returnBook.mutate(loan.id, {
      onError: (error) => {
        console.error(error)
        alert(t('bookDetails.markReturnedError'))
      },
    })
  }

  const handleTransfer = () => {
    if (!selectedTransferUser || !id) return alert(t('bookDetails.selectUserAlert'))
    if (!window.confirm(t('bookDetails.transferConfirm'))) return

    transferBook.mutate(
      { bookId: id, newOwnerId: selectedTransferUser },
      {
        onSuccess: () => {
          alert(t('bookDetails.transferSuccess'))
          setSelectedTransferUser('')
        },
        onError: (error) => {
          console.error(error)
          alert(t('bookDetails.transferError'))
        },
      }
    )
  }

  const handleToggleWishlist = () => {
    if (!user || !id) return

    toggleWishlist.mutate(
      { bookId: id, userId: user.id, wishlisted: isWishlisted },
      {
        onError: (error) => {
          console.error(error)
          alert(t('bookDetails.wishlistError'))
        },
      }
    )
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const handleAddComment = () => {
    if (!id || !user || !newComment.trim()) return

    addComment.mutate(
      { bookId: id, userId: user.id, comment: newComment.trim() },
      {
        onSuccess: () => setNewComment(''),
        onError: (error) => {
          console.error(error)
          alert(t('comments.addError'))
        },
      }
    )
  }

  const handleStartEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId)
    setEditingCommentText(currentText)
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditingCommentText('')
  }

  const handleSaveEditComment = () => {
    if (!id || !editingCommentId || !editingCommentText.trim()) return

    updateComment.mutate(
      { id: editingCommentId, bookId: id, comment: editingCommentText.trim() },
      {
        onSuccess: () => {
          setEditingCommentId(null)
          setEditingCommentText('')
        },
        onError: (error) => {
          console.error(error)
          alert(t('comments.updateError'))
        },
      }
    )
  }

  const handleDeleteComment = (commentId: string) => {
    if (!id) return
    if (!window.confirm(t('comments.deleteConfirm'))) return

    deleteComment.mutate(
      { id: commentId, bookId: id },
      {
        onError: (error) => {
          console.error(error)
          alert(t('comments.deleteError'))
        },
      }
    )
  }

  const tagNames = bookTags.map((bt) => bt.tag)

  const canRemoveTag = (tag: string) => {
    const row = bookTags.find((bt) => bt.tag === tag)
    if (!row) return false
    return isOwner || row.added_by === user?.id
  }

  const handleTagsChange = (newTags: string[]) => {
    if (!id || !user) return

    const added = newTags.find((nt) => !tagNames.includes(nt))
    if (added) {
      addTag.mutate(
        { bookId: id, tag: added, userId: user.id },
        {
          onError: (error) => {
            console.error(error)
            alert(t('bookDetails.addTagError'))
          },
        }
      )
      return
    }

    const removed = tagNames.find((nt) => !newTags.includes(nt))
    if (removed) {
      removeTag.mutate(
        { bookId: id, tag: removed },
        {
          onError: (error) => {
            console.error(error)
            alert(t('bookDetails.removeTagError'))
          },
        }
      )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {/* BACK */}
        <button
          onClick={() => navigate('/')}
          className="mb-5 rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200"
        >
          {t('bookDetails.back')}
        </button>

        {/* MAIN LAYOUT */}
        <div className="flex flex-col gap-6 md:flex-row">
          {/* LEFT: COVER */}
          <div className="md:w-56 md:shrink-0">
            {book.cover_url && (
              <img src={book.cover_url} className="w-40 rounded-lg sm:w-56 md:w-full" />
            )}
          </div>

          {/* RIGHT: INFO */}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">{book.title}</h1>
            <p className="text-gray-600">{book.author}</p>

            {/* EDIT */}
            {(isOwner || isAdmin) && (
              <button
                onClick={() => navigate(`/book/${id}/edit`)}
                className="mt-3 rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-800 hover:bg-gray-200"
              >
                {t('bookDetails.editBook')}
              </button>
            )}

            {/* OWNER */}
            <p className="mt-4 text-gray-700">
              👤 <b>{t('bookDetails.owner')}</b> {ownerName}
            </p>

            {/* BORROWER */}
            <p className="text-gray-700">
              📕 <b>{t('bookDetails.lentTo')}</b> {borrowerName || t('bookDetails.nobody')}
            </p>

            {/* WISHLIST TOGGLE */}
            {!isOwner && !book.archived && (
              <button
                onClick={handleToggleWishlist}
                disabled={toggleWishlist.isPending}
                className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                {isWishlisted ? t('bookDetails.wishlistRemove') : t('bookDetails.wishlistAdd')}
              </button>
            )}

            {/* STATUS */}
            <div className="mt-3">
              {status === 'available' && (
                <span className="rounded-md bg-green-100 px-2 py-1 text-green-800">
                  🟢 {t('bookStatus.available')}
                </span>
              )}

              {status === 'borrowed' && (
                <span className="rounded-md bg-red-100 px-2 py-1 text-red-800">
                  🔴 {t('bookStatus.borrowed')}
                </span>
              )}

              {status === 'blocked' && (
                <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-800">
                  🟡 {t('bookStatus.blocked')}
                </span>
              )}
            </div>

            {/* LISTING (GIFT/SALE) STATUS */}
            {book.listing_type && (
              <div className="mt-3">
                <span
                  className={
                    book.listing_type === 'gift'
                      ? 'rounded-md bg-purple-100 px-2 py-1 text-purple-800'
                      : 'rounded-md bg-amber-100 px-2 py-1 text-amber-800'
                  }
                >
                  {book.listing_type === 'gift' ? t('bookDetails.gift') : t('bookDetails.sale')}
                </span>
                {book.listing_comment && (
                  <p className="mt-1 text-sm text-gray-600">{book.listing_comment}</p>
                )}
              </div>
            )}

            {/* OWNER/ADMIN LENDING / RETURN CONTROL */}
            {(isOwner || isAdmin) && isBorrowed && (
              <div className="mt-5">
                <button
                  onClick={markAsReturned}
                  disabled={returnBook.isPending}
                  className="rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  {t('bookDetails.markReturned')}
                </button>
              </div>
            )}

            {isOwner && !isBorrowed && (
              <div className="mt-5">
                <h4 className="mb-2 font-medium text-gray-900">{t('bookDetails.lendToUser')}</h4>

                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">{t('bookDetails.selectUser')}</option>

                  {users.filter((u) => u.id !== user?.id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={lendToUser}
                  className="mt-2 rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90"
                >
                  {t('bookDetails.lend')}
                </button>
              </div>
            )}

            {(isOwner || isAdmin) && !isBorrowed && (
              <div className="mt-5">
                <h4 className="mb-2 font-medium text-gray-900">{t('bookDetails.transferTo')}</h4>

                <select
                  value={selectedTransferUser}
                  onChange={(e) => setSelectedTransferUser(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">{t('bookDetails.selectUser')}</option>

                  {users.filter((u) => u.id !== book.owner_id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleTransfer}
                  disabled={transferBook.isPending}
                  className="mt-2 rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200 disabled:opacity-50"
                >
                  {t('bookDetails.transfer')}
                </button>
              </div>
            )}

            {/* EXTRA INFO */}
            <div className="mt-4 space-y-1 text-gray-700">
              {book.description && (
                <p className="mb-2 whitespace-pre-line">{book.description}</p>
              )}

              <p><b>{t('bookDetails.collection')}</b> {book.collection}</p>
              <p><b>{t('bookDetails.ageRecommendation')}</b> {book.age_recommendation}</p>

              {book.isbn && (
                <p><b>{t('bookDetails.isbn')}</b> {book.isbn}</p>
              )}

              <div>
                <b>{t('bookDetails.tags')}</b>
                <div className="mt-1 max-w-sm">
                  <TagInput
                    value={tagNames}
                    onChange={handleTagsChange}
                    suggestions={allTags}
                    canRemove={canRemoveTag}
                  />
                </div>
              </div>

              {book.link && (
                <p>
                  🔗 <a href={book.link} target="_blank" className="text-brand hover:underline">
                    {t('bookDetails.viewLink')}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* COMMENTS */}
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">{t('comments.heading')}</h2>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('comments.placeholder')}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddComment}
              disabled={addComment.isPending || !newComment.trim()}
              className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {t('comments.add')}
            </button>
          </div>

          {comments.length === 0 ? (
            <p className="text-sm text-gray-600">{t('comments.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => {
                const commenterName = users.find((u) => u.id === c.user_id)?.name ?? t('common.unknown')
                const isCommentAuthor = c.user_id === user?.id
                const isEditing = editingCommentId === c.id

                return (
                  <li key={c.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <p className="font-semibold text-gray-900">
                        {commenterName}
                        <span className="ml-2 font-normal text-gray-500">
                          {formatDate(c.created_at)}
                          {c.updated_at !== c.created_at && ` ${t('comments.edited')}`}
                        </span>
                      </p>
                      {(isCommentAuthor || isAdmin) && !isEditing && (
                        <div className="flex gap-2">
                          {isCommentAuthor && (
                            <button
                              onClick={() => handleStartEditComment(c.id, c.comment)}
                              className="text-xs text-gray-600 hover:underline"
                            >
                              {t('comments.edit')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            disabled={deleteComment.isPending}
                            className="text-xs text-red-600 hover:underline disabled:opacity-50"
                          >
                            {t('comments.delete')}
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          rows={2}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEditComment}
                            disabled={updateComment.isPending || !editingCommentText.trim()}
                            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {t('comments.save')}
                          </button>
                          <button
                            onClick={handleCancelEditComment}
                            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-200"
                          >
                            {t('comments.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-line text-sm text-gray-700">{c.comment}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
