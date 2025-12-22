import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, UserPlus, LogOut as LeaveIcon, Crown, User as UserIcon, Globe } from "lucide-react";
import type { StudyGroup, User } from "@shared/schema";

type GroupWithCount = StudyGroup & { memberCount: number };
type GroupWithDetails = StudyGroup & {
  members: { id: string; userId: string; role: string; joinedAt: string; user: User }[];
  isMember: boolean;
  memberCount: number;
};

export default function StudyGroups() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  const { data: publicGroups = [], isLoading: isLoadingPublic } = useQuery<GroupWithCount[]>({
    queryKey: ['/api/study-groups'],
  });

  const { data: myGroups = [], isLoading: isLoadingMy } = useQuery<GroupWithCount[]>({
    queryKey: ['/api/study-groups/my'],
  });

  const { data: selectedGroup, isLoading: isLoadingDetails } = useQuery<GroupWithDetails>({
    queryKey: [`/api/study-groups/${selectedGroupId}`],
    enabled: !!selectedGroupId,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return apiRequest('POST', '/api/study-groups', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups/my'] });
      setIsCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      toast({ title: "学习小组创建成功！" });
    },
    onError: () => {
      toast({ title: "创建小组失败", variant: "destructive" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest('POST', `/api/study-groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups/my'] });
      if (selectedGroupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/study-groups/${selectedGroupId}`] });
      }
      toast({ title: "成功加入小组！" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "加入小组失败", variant: "destructive" });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest('DELETE', `/api/study-groups/${groupId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/study-groups/my'] });
      if (selectedGroupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/study-groups/${selectedGroupId}`] });
      }
      toast({ title: "已退出小组" });
    },
    onError: (error: Error) => {
      toast({ title: error.message || "退出小组失败", variant: "destructive" });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
    });
  };

  const renderGroupCard = (group: GroupWithCount, showJoinButton = false) => (
    <Card
      key={group.id}
      className="hover-elevate cursor-pointer"
      onClick={() => setSelectedGroupId(group.id)}
      data-testid={`card-group-${group.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {group.name}
          </CardTitle>
          {group.isPublic && (
            <Badge variant="secondary" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              公开
            </Badge>
          )}
        </div>
        {group.description && (
          <CardDescription className="line-clamp-2">{group.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {group.memberCount} / {group.maxMembers} 成员
          </span>
          {showJoinButton && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                joinGroupMutation.mutate(group.id);
              }}
              disabled={joinGroupMutation.isPending}
              data-testid={`button-join-${group.id}`}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              加入
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderGroupList = (groups: GroupWithCount[], isLoading: boolean, showJoinButton = false) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无学习小组</p>
          <p className="text-sm">创建或加入一个小组开始协作学习</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => renderGroupCard(group, showJoinButton))}
      </div>
    );
  };

  const renderGroupDetails = () => {
    if (!selectedGroupId) return null;

    if (isLoadingDetails) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!selectedGroup) return null;

    return (
      <Dialog open={!!selectedGroupId} onOpenChange={() => setSelectedGroupId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {selectedGroup.name}
            </DialogTitle>
            {selectedGroup.description && (
              <DialogDescription>{selectedGroup.description}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">成员数量</span>
              <span>{selectedGroup.memberCount} / {selectedGroup.maxMembers}</span>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">成员列表</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedGroup.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        <UserIcon className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm">{member.user.username}</span>
                    {member.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        管理员
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            {selectedGroup.isMember ? (
              <Button
                variant="outline"
                onClick={() => leaveGroupMutation.mutate(selectedGroup.id)}
                disabled={leaveGroupMutation.isPending || selectedGroup.members.some(m => m.userId === selectedGroup.createdBy && m.role === 'admin')}
                data-testid="button-leave-group"
              >
                <LeaveIcon className="w-4 h-4 mr-2" />
                退出小组
              </Button>
            ) : (
              <Button
                onClick={() => joinGroupMutation.mutate(selectedGroup.id)}
                disabled={joinGroupMutation.isPending || selectedGroup.memberCount >= selectedGroup.maxMembers}
                data-testid="button-join-group"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                加入小组
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-study-groups-title">学习小组</h1>
          <p className="text-muted-foreground">加入学习小组，与其他学习者一起进步</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-group">
              <Plus className="w-4 h-4 mr-2" />
              创建小组
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建学习小组</DialogTitle>
              <DialogDescription>
                创建一个学习小组，邀请其他学习者加入
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">小组名称</Label>
                <Input
                  id="groupName"
                  placeholder="输入小组名称"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  data-testid="input-group-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDescription">小组描述（可选）</Label>
                <Textarea
                  id="groupDescription"
                  placeholder="描述小组的学习目标和特点"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  data-testid="input-group-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || createGroupMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createGroupMutation.isPending ? "创建中..." : "创建小组"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="my" data-testid="tab-my-groups">我的小组</TabsTrigger>
          <TabsTrigger value="browse" data-testid="tab-browse-groups">浏览小组</TabsTrigger>
        </TabsList>
        <TabsContent value="my">
          {renderGroupList(myGroups, isLoadingMy)}
        </TabsContent>
        <TabsContent value="browse">
          {renderGroupList(
            publicGroups.filter(g => !myGroups.some(mg => mg.id === g.id)),
            isLoadingPublic,
            true
          )}
        </TabsContent>
      </Tabs>

      {renderGroupDetails()}
    </div>
  );
}
